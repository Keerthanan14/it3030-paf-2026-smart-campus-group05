package com.smartcampus.resource.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ResourceReportAuditRequest(
        @NotBlank(message = "format is required")
        String format,
        @Min(value = 1, message = "selectedColumnCount must be at least 1")
        int selectedColumnCount
) {
}
