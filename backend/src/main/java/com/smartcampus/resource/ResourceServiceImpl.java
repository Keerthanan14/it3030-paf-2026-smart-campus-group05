package com.smartcampus.resource;

import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.resource.dto.CreateResourceRequest;
import com.smartcampus.resource.dto.PaginatedResourceResponse;
import com.smartcampus.resource.dto.ResourceAvailabilityResponse;
import com.smartcampus.resource.dto.ResourceResponse;
import com.smartcampus.resource.dto.UpdateResourceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.UUID;

@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    public PaginatedResourceResponse getResources(ResourceType type,
                                                  Integer capacity,
                                                  String location,
                                                  String keyword,
                                                  ResourceStatus status,
                                                  int page,
                                                  int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }

        ResourceStatus resolvedStatus = status == null ? ResourceStatus.ACTIVE : status;

        Specification<Resource> specification = Specification
                .where(ResourceSpecifications.notDeleted())
                .and(ResourceSpecifications.hasType(type))
                .and(ResourceSpecifications.minCapacity(capacity))
                .and(ResourceSpecifications.hasLocationLike(location))
                .and(ResourceSpecifications.hasKeyword(keyword))
                .and(ResourceSpecifications.hasStatus(resolvedStatus));

        Page<ResourceResponse> result = resourceRepository
                .findAll(specification, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);

        return new PaginatedResourceResponse(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }

    @Override
    public ResourceResponse getResourceById(UUID id) {
        Resource resource = getExistingResource(id);
        return toResponse(resource);
    }

    @Override
    public ResourceResponse createResource(CreateResourceRequest request) {
        Resource resource = new Resource();
        resource.setName(request.name());
        resource.setType(request.type());
        resource.setCapacity(request.capacity());
        resource.setLocation(request.location());
        resource.setDescription(request.description());
        resource.setAvailabilityWindows(request.availabilityWindows());
        resource.setStatus(ResourceStatus.ACTIVE);

        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse updateResource(UUID id, UpdateResourceRequest request) {
        Resource resource = getExistingResource(id);
        resource.setName(request.name());
        resource.setType(request.type());
        resource.setCapacity(request.capacity());
        resource.setLocation(request.location());
        resource.setDescription(request.description());
        resource.setAvailabilityWindows(request.availabilityWindows());
        resource.setStatus(request.status());

        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse updateResourceStatus(UUID id, ResourceStatus status) {
        Resource resource = getExistingResource(id);
        resource.setStatus(status);
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public void softDeleteResource(UUID id) {
        Resource resource = getExistingResource(id);
        resource.setDeleted(true);
        resourceRepository.save(resource);
    }

    @Override
    public ResourceAvailabilityResponse getResourceAvailability(UUID id, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from date must be before or equal to to date");
        }

        Resource resource = getExistingResource(id);

        // Booking integration will populate blocked slots once booking module is connected.
        return new ResourceAvailabilityResponse(
                resource.getId(),
                resource.getName(),
                resource.getAvailabilityWindows(),
                Collections.emptyList()
        );
    }

    private Resource getExistingResource(UUID id) {
        return resourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + id));
    }

    private ResourceResponse toResponse(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getDescription(),
                resource.getAvailabilityWindows(),
                resource.getStatus(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }
}