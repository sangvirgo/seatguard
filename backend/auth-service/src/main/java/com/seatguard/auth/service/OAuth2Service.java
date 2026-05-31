package com.seatguard.auth.service;

import com.seatguard.auth.dto.AuthResponse;
import com.seatguard.auth.entity.Role;
import com.seatguard.auth.entity.User;
import com.seatguard.auth.repository.UserRepository;
import com.seatguard.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.seatguard.auth.entity.RefreshToken;
import com.seatguard.auth.repository.RefreshTokenRepository;

@Service
public class OAuth2Service {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Value("${jwt.expiration}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    public OAuth2Service(UserRepository userRepository,
                         RefreshTokenRepository refreshTokenRepository,
                         JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse processGoogleLogin(String email, String name, String googleSub) {
        // Check ADMIN_EMAILS env
        Set<String> adminEmails = getAdminEmails();
        Role targetRole = adminEmails.contains(email.toLowerCase()) ? Role.ADMIN : Role.USER;

        // Try find by email first
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Link Google if not already linked
            if (user.getOauthProvider() == null || !"google".equals(user.getOauthProvider())) {
                user.setOauthProvider("google");
                user.setOauthId(googleSub);
            }
            // Upgrade to ADMIN if email matches
            if (targetRole == Role.ADMIN && user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
            }
            user = userRepository.save(user);
        } else {
            // Create new user
            user = new User();
            user.setEmail(email);
            user.setFullName(name != null ? name : email);
            user.setOauthProvider("google");
            user.setOauthId(googleSub);
            user.setRole(targetRole);
            user.setIsActive(true);
            user = userRepository.save(user);
        }

        return buildAuthResponse(user);
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

    private Set<String> getAdminEmails() {
        String env = System.getenv("ADMIN_EMAILS");
        if (env == null || env.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(env.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
