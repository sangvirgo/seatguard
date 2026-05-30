package com.seatguard.auth.dto;

import com.seatguard.auth.entity.Role;
import com.seatguard.auth.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        Role role,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
