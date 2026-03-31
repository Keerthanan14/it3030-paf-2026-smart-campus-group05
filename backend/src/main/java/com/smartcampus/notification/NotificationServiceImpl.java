package com.smartcampus.notification;

import com.smartcampus.notification.dto.NotificationResponse;
import com.smartcampus.notification.dto.NotificationUpdateResponse;
import com.smartcampus.notification.dto.PaginatedNotificationResponse;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedNotificationResponse getUserNotifications(UUID userId, boolean unreadOnly, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage;

        if (unreadOnly) {
            notificationPage = notificationRepository.findAllByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
        } else {
            notificationPage = notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        List<NotificationResponse> content = notificationPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PaginatedNotificationResponse(
                content,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.isLast(),
                unreadCount
        );
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);

        return mapToResponse(notification);
    }

    @Override
    @Transactional
    public NotificationUpdateResponse markAllAsRead(UUID userId) {
        int updatedCount = notificationRepository.markAllAsRead(userId);
        return new NotificationUpdateResponse("All notifications marked as read.", updatedCount);
    }

    @Override
    @Transactional
    public void sendBookingNotification(UUID userId, UUID bookingId, boolean approved, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setReferenceId(bookingId);
        notification.setReferenceType(ReferenceType.BOOKING);
        
        if (approved) {
            notification.setType(NotificationType.BOOKING_APPROVED);
            notification.setMessage("Your booking has been approved.");
        } else {
            notification.setType(NotificationType.BOOKING_REJECTED);
            notification.setMessage("Your booking has been rejected: " + reason);
        }
        
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void sendTicketStatusNotification(UUID userId, UUID ticketId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setReferenceId(ticketId);
        notification.setReferenceType(ReferenceType.TICKET);
        notification.setType(NotificationType.TICKET_STATUS_CHANGE);
        notification.setMessage("Your ticket status has been updated to " + status + ".");
        
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void sendNewCommentNotification(UUID ticketOwnerId, UUID ticketId, String commenterName) {
        User user = userRepository.findById(ticketOwnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setReferenceId(ticketId);
        notification.setReferenceType(ReferenceType.TICKET);
        notification.setType(NotificationType.NEW_COMMENT);
        notification.setMessage("A new comment was added to your ticket by " + commenterName + ".");
        
        notificationRepository.save(notification);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getMessage(),
                n.isRead(),
                n.getReferenceId(),
                n.getReferenceType() != null ? n.getReferenceType().name() : null,
                n.getCreatedAt()
        );
    }
}