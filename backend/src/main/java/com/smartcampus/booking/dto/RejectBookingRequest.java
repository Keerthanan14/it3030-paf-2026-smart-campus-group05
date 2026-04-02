package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectBookingRequest(
        @NotBlank @Size(min = 10, max = 500) String rejectionReason
) {
}
