package com.seatguard.auth.service;

import com.seatguard.auth.dto.*;
import com.seatguard.auth.entity.RefreshToken;
import com.seatguard.auth.entity.Role;
import com.seatguard.auth.entity.User;
import com.seatguard.auth.exception.EmailAlreadyExistsException;
import com.seatguard.auth.exception.InvalidCredentialsException;
import com.seatguard.auth.repository.RefreshTokenRepository;
import com.seatguard.auth.repository.UserRepository;
import com.seatguard.auth.security.JwtUtil;
import com.seatguard.auth.security.PasswordUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordUtil passwordUtil;
    private final JwtUtil jwtUtil;

    @Value("${jwt.expiration}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordUtil passwordUtil,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordUtil = passwordUtil;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordUtil.hashPassword(request.password()));
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setRole(Role.USER);
        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!user.getIsActive()) {
            throw new InvalidCredentialsException("Account is deactivated");
        }

        if (!passwordUtil.verifyPassword(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshRequest request) {
        String tokenHash = hashToken(request.refreshToken());

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid refresh token"));

        if (refreshToken.getRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("Refresh token expired or revoked");
        }

        // Revoke old token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));
        return UserResponse.from(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = generateRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken,
                accessTokenExpirationMs / 1000
        );
    }

    private String generateRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000));
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
