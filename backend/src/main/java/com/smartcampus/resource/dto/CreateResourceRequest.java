package com.smartcampus.resource.dto;

import com.smartcampus.resource.AvailabilityWindow;
import com.smartcampus.resource.ResourceType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateResourceRequest(
        @NotBlank @Size(min = 3, max = 255) String name,
        @NotNull ResourceType type,
        @Min(0) Integer capacity,
        @NotBlank String building,
        @NotNull @Min(0) @Max(5) Integer floor,
        @NotNull @Min(0) Integer chairCount,
        @NotNull @Min(0) Integer tableCount,
        @NotNull Boolean hasAc,
        @NotNull Boolean hasFan,
        @NotNull Boolean hasProjector,
        @NotNull Boolean hasSmartboard,
        @NotNull Boolean hasCamera,
        Boolean hasPodiumWithPc,
        Boolean hasPodium,
        Boolean hasWhiteboard,
        Boolean hasClock,
        Boolean hasLectureChairs,
        Boolean hasLectureDesks,
        Boolean hasSpeakers,
        Boolean hasWifi,
        Boolean hasPowerOutlets,
        @Min(0) Integer pcCount,
        @Min(0) Integer equipmentCount,
        @Size(max = 1000) String description,
        Map<String, AvailabilityWindow> availabilityWindows,
        Boolean allowBookings,
        Boolean allowRequests
) {
}