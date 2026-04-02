package com.smartcampus.resource.dto;

import com.smartcampus.resource.AvailabilityWindow;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ResourceAvailabilityResponse(
        UUID resourceId,
        String resourceName,
        Map<String, AvailabilityWindow> availabilityWindows,
        List<BookedSlotResponse> bookedSlots
) {
    public record BookedSlotResponse(
            String date,
            String startTime,
            String endTime,
            String purpose
    ) {
    }
}