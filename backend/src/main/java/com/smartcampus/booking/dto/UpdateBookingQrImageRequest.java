package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBookingQrImageRequest(
        @NotBlank(message = "imageDataUrl is required")
        String imageDataUrl
) {
}
