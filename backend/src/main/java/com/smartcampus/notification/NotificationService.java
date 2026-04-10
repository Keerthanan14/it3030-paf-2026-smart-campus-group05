package com.smartcampus.notification;

import com.smartcampus.notification.dto.NotificationResponse;
import com.smartcampus.notification.dto.NotificationUpdateResponse;
import com.smartcampus.notification.dto.PaginatedNotificationResponse;

import java.util.UUID;

public interface NotificationService {

    PaginatedNotificationResponse getUserNotifications(UUID userId, boolean unreadOnly, int page, int size);

    NotificationResponse markAsRead(UUID userId, UUID notificationId);

    NotificationUpdateResponse markAllAsRead(UUID userId);

    void sendBookingCreatedNotification(UUID userId, UUID bookingId);

    void sendBookingNotification(UUID userId, UUID bookingId, boolean approved, String reason);

    void sendBookingCancelledNotification(UUID userId, UUID bookingId);

    void sendTicketCreatedNotification(UUID userId, UUID ticketId, String priority);

    void sendTicketCreatedNotificationToAdmins(UUID ticketId, String priority, UUID ticketOwnerId);

    void sendTicketStatusNotification(UUID userId, UUID ticketId, String status);

    void sendNewCommentNotification(UUID ticketOwnerId, UUID ticketId, String commenterName);
}