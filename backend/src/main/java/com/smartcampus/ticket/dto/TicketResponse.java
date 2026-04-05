package com.smartcampus.ticket.dto;

import com.smartcampus.ticket.TicketPriority;
import com.smartcampus.ticket.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID userId,
        String userName,
        UUID resourceId,
        String resourceName,
        String category,
        String description,
        TicketPriority priority,
        TicketStatus status,
        UUID assignedToId,
        String assignedToName,
        String resolutionNotes,
        String rejectionReason,
        String preferredContact,
        LocalDateTime firstResponseAt,
        LocalDateTime resolvedAt,
        String timeToFirstResponse,
        String timeToResolution,
        boolean firstResponseBreached,
        boolean resolutionBreached,
        List<TicketAttachmentResponse> attachments,
        List<CommentResponse> comments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
