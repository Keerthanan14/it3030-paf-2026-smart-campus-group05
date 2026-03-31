package com.smartcampus.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record StaffCreateRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        @NotBlank String role) {
}