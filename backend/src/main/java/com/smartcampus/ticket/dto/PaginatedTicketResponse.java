package com.smartcampus.ticket.dto;

import java.util.List;

public record PaginatedTicketResponse(
        List<TicketResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int size
) {
}
