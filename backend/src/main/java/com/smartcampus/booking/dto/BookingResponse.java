package com.smartcampus.booking.dto;

import com.smartcampus.booking.BookingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID userId,
        String userName,
        UUID resourceId,
        String resourceName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        Integer attendeesCount,
        BookingStatus status,
        String rejectionReason,
        String qrCodeUrl,
        LocalDateTime createdAt,
                LocalDateTime updatedAt,
                Map<String, LinkResponse> _links
) {
        public record LinkResponse(String href) {
        }
}
