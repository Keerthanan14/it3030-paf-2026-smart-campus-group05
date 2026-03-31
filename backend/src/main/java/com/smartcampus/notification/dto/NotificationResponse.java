package com.smartcampus.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String message,
    boolean isRead,
    UUID referenceId,
    String referenceType,
    LocalDateTime createdAt
) {
}