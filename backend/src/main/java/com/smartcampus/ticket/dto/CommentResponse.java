package com.smartcampus.ticket.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID ticketId,
        UUID userId,
        String userName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
