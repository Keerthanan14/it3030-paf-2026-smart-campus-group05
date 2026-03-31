package com.smartcampus.security;

import java.util.UUID;

public record AuthUserPrincipal(UUID userId, String email, String role) {
}
