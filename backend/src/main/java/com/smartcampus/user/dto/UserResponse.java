package com.smartcampus.user.dto;

import com.smartcampus.user.Role;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        Role role,
        LocalDateTime createdAt
) {}
