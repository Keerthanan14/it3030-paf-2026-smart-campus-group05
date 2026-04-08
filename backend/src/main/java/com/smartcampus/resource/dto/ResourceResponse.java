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
        String building,
        Integer floor,
        String location,
        Integer chairCount,
        Integer tableCount,
        Integer pcCount,
        Integer equipmentCount,
        Boolean hasAc,
        Boolean hasFan,
        Boolean hasProjector,
        Boolean hasSmartboard,
        Boolean hasCamera,
        Boolean hasPodiumWithPc,
        Boolean hasPodium,
        Boolean hasWhiteboard,
        Boolean hasClock,
        Boolean hasLectureChairs,
        Boolean hasLectureDesks,
        Boolean hasSpeakers,
        Boolean hasWifi,
        Boolean hasPowerOutlets,
        String description,
        Map<String, AvailabilityWindow> availabilityWindows,
        Boolean allowBookings,
        Boolean allowRequests,
        ResourceStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}