package com.smartcampus.audit;

import com.smartcampus.audit.dto.PaginatedAuditLogResponse;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public interface AuditLogService {

    void logAction(UUID actorUserId,
                   String action,
                   String entityType,
                   UUID entityId,
                   Map<String, Object> oldValue,
                   Map<String, Object> newValue);

    PaginatedAuditLogResponse getAuditLogs(String entityType,
                                           String action,
                                           UUID userId,
                                           LocalDateTime from,
                                           LocalDateTime to,
                                           int page,
                                           int size);
}
