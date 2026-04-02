package com.smartcampus.booking.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateBookingRequest(
        @NotNull UUID resourceId,
        @NotNull @FutureOrPresent LocalDate bookingDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotBlank @Size(min = 5, max = 500) String purpose,
        @Min(1) Integer attendeesCount
) {
}
