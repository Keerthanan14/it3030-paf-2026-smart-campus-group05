package com.smartcampus.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetPasswordRequest(
        @Email @NotBlank String email,
        @NotBlank String code,
        @NotBlank @Size(min = 8, max = 100) String password) {
}