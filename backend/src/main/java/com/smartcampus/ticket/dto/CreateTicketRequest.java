package com.smartcampus.ticket.dto;

import com.smartcampus.ticket.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTicketRequest(
        UUID resourceId,
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(min = 10, max = 2000) String description,
        @NotNull TicketPriority priority,
        @Size(max = 255) String preferredContact
) {
}
