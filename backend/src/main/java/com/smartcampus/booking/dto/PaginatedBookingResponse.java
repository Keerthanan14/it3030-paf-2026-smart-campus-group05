package com.smartcampus.booking.dto;

import java.util.List;
import java.util.Map;

public record PaginatedBookingResponse(
        List<BookingResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int size,
        Map<String, BookingResponse.LinkResponse> _links
) {
}
