package com.smartcampus.resource.dto;

import com.smartcampus.resource.AvailabilityWindow;
import com.smartcampus.resource.ResourceStatus;
import com.smartcampus.resource.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record UpdateResourceRequest(
        @NotBlank @Size(min = 3, max = 255) String name,
        @NotNull ResourceType type,
        @NotNull @Min(1) Integer capacity,
        @NotBlank @Size(min = 3, max = 255) String location,
        @Size(max = 1000) String description,
        Map<String, AvailabilityWindow> availabilityWindows,
        @NotNull ResourceStatus status
) {
}