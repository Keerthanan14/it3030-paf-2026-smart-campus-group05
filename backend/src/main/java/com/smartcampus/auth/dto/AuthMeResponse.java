package com.smartcampus.auth.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuthMeResponse(
        UUID id,
        String email,
        String name,
        String profilePicture,
        String role,
        String authProvider,
        boolean emailVerified,
        boolean forcePasswordChange,
        LocalDateTime createdAt) {
}