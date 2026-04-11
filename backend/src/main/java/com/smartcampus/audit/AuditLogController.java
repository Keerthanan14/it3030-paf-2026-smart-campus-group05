package com.smartcampus.audit;

import com.smartcampus.audit.dto.PaginatedAuditLogResponse;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.security.AuthUserPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public PaginatedAuditLogResponse getAuditLogs(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID effectiveUserId = userId;
        if (principal != null && isTechnicianRole(principal.role())) {
            if (userId != null && !userId.equals(principal.userId())) {
                throw new ForbiddenException("Technicians can only view their own audit logs");
            }
            effectiveUserId = principal.userId();
        }

        return auditLogService.getAuditLogs(entityType, action, effectiveUserId, from, to, page, size);
    }

    private boolean isTechnicianRole(String role) {
        return "TECHNICIAN".equalsIgnoreCase(role) || "ROLE_TECHNICIAN".equalsIgnoreCase(role);
    }
}
