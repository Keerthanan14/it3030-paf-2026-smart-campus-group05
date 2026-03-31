package com.smartcampus.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String refreshToken) { // Temporarily holds the refresh token until we strip it out into a cookie
}