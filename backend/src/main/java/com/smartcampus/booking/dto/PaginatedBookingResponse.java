package com.smartcampus.booking.dto;

import java.util.List;

public record PaginatedBookingResponse(
        List<BookingResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int size
) {
}
