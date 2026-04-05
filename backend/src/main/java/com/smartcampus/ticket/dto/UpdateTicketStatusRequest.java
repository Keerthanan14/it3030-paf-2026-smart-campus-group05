package com.smartcampus.ticket.dto;

import com.smartcampus.ticket.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTicketStatusRequest(
        @NotNull TicketStatus status,
        @Size(max = 2000) String resolutionNotes,
        @Size(max = 2000) String rejectionReason
) {
}
