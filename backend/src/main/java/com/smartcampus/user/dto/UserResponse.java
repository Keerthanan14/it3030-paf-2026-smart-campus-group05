package com.smartcampus.user.dto;

import com.smartcampus.user.Role;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        Role role
) {}
