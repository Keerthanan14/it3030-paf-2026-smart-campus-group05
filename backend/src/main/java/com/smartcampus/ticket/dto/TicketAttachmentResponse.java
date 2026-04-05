package com.smartcampus.ticket.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketAttachmentResponse(
        UUID id,
        String fileName,
        String fileUrl,
        Long fileSize,
        LocalDateTime createdAt
) {
}
