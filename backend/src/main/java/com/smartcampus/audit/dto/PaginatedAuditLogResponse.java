package com.smartcampus.audit.dto;

import java.util.List;

public record PaginatedAuditLogResponse(
        List<AuditLogResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}
