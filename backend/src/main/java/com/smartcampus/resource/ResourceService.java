package com.smartcampus.resource;

import com.smartcampus.resource.dto.CreateResourceRequest;
import com.smartcampus.resource.dto.PaginatedResourceResponse;
import com.smartcampus.resource.dto.ResourceAvailabilityResponse;
import com.smartcampus.resource.dto.ResourceResponse;
import com.smartcampus.resource.dto.UpdateResourceRequest;

import java.time.LocalDate;
import java.util.UUID;

public interface ResourceService {
    PaginatedResourceResponse getResources(ResourceType type,
                                           Integer capacity,
                                           String location,
                                           String keyword,
                                           ResourceStatus status,
                                           String requesterRole,
                                           int page,
                                           int size);

    ResourceResponse getResourceById(UUID id);

    ResourceResponse createResource(CreateResourceRequest request);

    ResourceResponse updateResource(UUID id, UpdateResourceRequest request);

    ResourceResponse updateResourceStatus(UUID id, ResourceStatus status);

    void softDeleteResource(UUID id);

    ResourceAvailabilityResponse getResourceAvailability(UUID id, LocalDate from, LocalDate to);

    boolean isResourceBookable(UUID id);
}