package com.smartcampus.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn) {
}