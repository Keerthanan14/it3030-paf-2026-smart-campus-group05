package com.smartcampus.notification;

import com.smartcampus.notification.dto.NotificationResponse;
import com.smartcampus.notification.dto.NotificationUpdateResponse;
import com.smartcampus.notification.dto.PaginatedNotificationResponse;
import com.smartcampus.security.AuthUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public PaginatedNotificationResponse getUserNotifications(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return notificationService.getUserNotifications(principal.userId(), unreadOnly, page, size);
    }

    @PutMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID id) {
        
        return notificationService.markAsRead(principal.userId(), id);
    }

    @PutMapping("/read-all")
    public NotificationUpdateResponse markAllAsRead(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return notificationService.markAllAsRead(principal.userId());
    }
}