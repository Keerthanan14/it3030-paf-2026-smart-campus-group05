package com.smartcampus.notification.dto;

import java.util.List;

public record PaginatedNotificationResponse(
    List<NotificationResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean last,
    long unreadCount
) {
}