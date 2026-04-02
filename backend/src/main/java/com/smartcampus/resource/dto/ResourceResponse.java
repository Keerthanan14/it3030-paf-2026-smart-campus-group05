package com.smartcampus.resource.dto;

import com.smartcampus.resource.AvailabilityWindow;
import com.smartcampus.resource.ResourceStatus;
import com.smartcampus.resource.ResourceType;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record ResourceResponse(
        UUID id,
        String name,
        ResourceType type,
        Integer capacity,
        String location,
        String description,
        Map<String, AvailabilityWindow> availabilityWindows,
        ResourceStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}