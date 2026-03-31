package com.smartcampus.auth.dto;

public record StaffCreateResponse(
        String message,
        String email,
        String role) {
}