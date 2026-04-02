package com.smartcampus.resource.dto;

import java.util.List;

public record PaginatedResourceResponse(
        List<ResourceResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int size
) {
}