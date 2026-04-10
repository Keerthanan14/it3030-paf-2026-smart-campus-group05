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
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository, 
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.emailService = emailService;
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
    public void sendBookingCreatedNotification(UUID userId, UUID bookingId) {
        createAndPushNotification(
                userId,
                bookingId,
                ReferenceType.BOOKING,
                NotificationType.BOOKING_CREATED,
                "Your booking was created and is pending approval."
        );
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

        String subject;
        String textBody;

        if (approved) {
            notification.setType(NotificationType.BOOKING_APPROVED);
            notification.setMessage("Your booking has been approved.");
            
            subject = "Booking Approved";
            textBody = "Hello " + user.getName() + ",\n\nYour booking request has been approved.\n\nRegards,\nSmart Campus Team";
        } else {
            notification.setType(NotificationType.BOOKING_REJECTED);
            notification.setMessage("Your booking has been rejected: " + reason);
            
            subject = "Booking Rejected";
            textBody = "Hello " + user.getName() + ",\n\nYour booking request has been rejected.\nReason: " + reason + "\n\nRegards,\nSmart Campus Team";
        }

        notification = notificationRepository.save(notification);
        pushToWebSocket(notification);
        emailService.sendEmail(user.getEmail(), subject, textBody);
    }

    @Override
    @Transactional
    public void sendBookingCancelledNotification(UUID userId, UUID bookingId) {
        createAndPushNotification(
                userId,
                bookingId,
                ReferenceType.BOOKING,
                NotificationType.BOOKING_CANCELLED,
                "Your approved booking has been cancelled."
        );
    }

    @Override
    @Transactional
    public void sendTicketCreatedNotification(UUID userId, UUID ticketId, String priority) {
        String normalizedPriority = priority == null ? "UNKNOWN" : priority.trim().toUpperCase();
        String message = "Your ticket was created with priority " + normalizedPriority + ".";

        if ("CRITICAL".equals(normalizedPriority)) {
            message = "Your CRITICAL ticket was created and marked for urgent attention.";
        }

        createAndPushNotification(
                userId,
                ticketId,
                ReferenceType.TICKET,
                NotificationType.TICKET_CREATED,
                message
        );
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

        notification = notificationRepository.save(notification);
        pushToWebSocket(notification);

        if ("RESOLVED".equalsIgnoreCase(status) || "CLOSED".equalsIgnoreCase(status)) {
            String subject = "Ticket Status Updated";
            String textBody = "Hello " + user.getName() + ",\n\nYour ticket status has been updated to " + status + ".\n\nRegards,\nSmart Campus Team";
            emailService.sendEmail(user.getEmail(), subject, textBody);
        }
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

        notification = notificationRepository.save(notification);
        pushToWebSocket(notification);
    }

    private void createAndPushNotification(UUID userId,
                                           UUID referenceId,
                                           ReferenceType referenceType,
                                           NotificationType notificationType,
                                           String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setType(notificationType);
        notification.setMessage(message);
        notification.setRead(false);

        Notification saved = notificationRepository.save(notification);
        pushToWebSocket(saved);
    }
    
    private void pushToWebSocket(Notification notification) {
        NotificationResponse response = mapToResponse(notification);
        messagingTemplate.convertAndSendToUser(
                notification.getUser().getId().toString(),
                "/queue/notifications",
                response
        );
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