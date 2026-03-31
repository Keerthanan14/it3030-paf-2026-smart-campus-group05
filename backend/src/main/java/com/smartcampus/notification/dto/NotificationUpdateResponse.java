package com.smartcampus.notification.dto;

public record NotificationUpdateResponse(
    String message,
    int updatedCount
) {
}