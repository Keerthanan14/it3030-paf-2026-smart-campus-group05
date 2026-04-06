package com.smartcampus.resource;

import com.smartcampus.booking.BookingRepository;
import com.smartcampus.booking.BookingStatus;
import com.smartcampus.booking.BookingService;
import com.smartcampus.exception.ConflictException;
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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ResourceServiceImpl implements ResourceService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final ResourceRepository resourceRepository;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository,
                               BookingService bookingService,
                               BookingRepository bookingRepository) {
        this.resourceRepository = resourceRepository;
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public PaginatedResourceResponse getResources(ResourceType type,
                                                  Integer capacity,
                                                  String location,
                                                  String keyword,
                                                  ResourceStatus status,
                                                  String requesterRole,
                                                  int page,
                                                  int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }

        ResourceStatus resolvedStatus = resolveVisibleStatus(requesterRole, status);

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
        validateAvailabilityWindows(request.availabilityWindows());

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
        validateAvailabilityWindows(request.availabilityWindows());

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
        ResourceStatus previousStatus = resource.getStatus();
        resource.setStatus(status);
        Resource saved = resourceRepository.save(resource);

        if (previousStatus != ResourceStatus.OUT_OF_SERVICE && status == ResourceStatus.OUT_OF_SERVICE) {
            handleOutOfServiceTransition(saved);
        }

        return toResponse(saved);
    }

    @Override
    public void softDeleteResource(UUID id) {
        Resource resource = getExistingResource(id);

        boolean hasFutureApprovedBookings = bookingRepository.existsByResource_IdAndStatusAndBookingDateGreaterThanEqual(
                resource.getId(),
                BookingStatus.APPROVED,
                LocalDate.now()
        );

        if (hasFutureApprovedBookings) {
            throw new ConflictException("Cannot delete resource with active approved bookings in the future");
        }

        resource.setDeleted(true);
        resourceRepository.save(resource);
    }

    @Override
    public ResourceAvailabilityResponse getResourceAvailability(UUID id, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from date must be before or equal to to date");
        }

        Resource resource = getExistingResource(id);

        List<ResourceAvailabilityResponse.BookedSlotResponse> bookedSlots = bookingRepository
            .findByResource_IdAndStatusAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                id,
                BookingStatus.APPROVED,
                from,
                to
            )
            .stream()
            .map(booking -> new ResourceAvailabilityResponse.BookedSlotResponse(
                booking.getBookingDate().toString(),
                booking.getStartTime().toString(),
                booking.getEndTime().toString(),
                booking.getPurpose()
            ))
            .toList();

        return new ResourceAvailabilityResponse(
                resource.getId(),
                resource.getName(),
                resource.getAvailabilityWindows(),
            bookedSlots
        );
    }

    @Override
    public boolean isResourceBookable(UUID id) {
        return resourceRepository.findByIdAndDeletedFalse(id)
                .map(resource -> resource.getStatus() == ResourceStatus.ACTIVE)
                .orElse(false);
    }

    private Resource getExistingResource(UUID id) {
        return resourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + id));
    }

    ResourceStatus resolveVisibleStatus(String requesterRole, ResourceStatus requestedStatus) {
        if (isAdminRole(requesterRole)) {
            return requestedStatus;
        }
        return ResourceStatus.ACTIVE;
    }

    boolean isAdminRole(String requesterRole) {
        return "ADMIN".equalsIgnoreCase(requesterRole) || "ROLE_ADMIN".equalsIgnoreCase(requesterRole);
    }

    private void handleOutOfServiceTransition(Resource resource) {
        bookingService.autoRejectPendingForResourceOutOfService(resource.getId());
    }

    private void validateAvailabilityWindows(Map<String, AvailabilityWindow> windows) {
        if (windows == null || windows.isEmpty()) {
            return;
        }

        for (Map.Entry<String, AvailabilityWindow> entry : windows.entrySet()) {
            String day = entry.getKey();
            AvailabilityWindow window = entry.getValue();

            if (window == null) {
                throw new IllegalArgumentException("availability window is required for day: " + day);
            }

            LocalTime open = parseWindowTime(day, "open", window.getOpen());
            LocalTime close = parseWindowTime(day, "close", window.getClose());

            if (!open.isBefore(close)) {
                throw new IllegalArgumentException("availability window open time must be before close time for day: " + day);
            }
        }
    }

    private LocalTime parseWindowTime(String day, String fieldName, String timeValue) {
        if (timeValue == null || timeValue.isBlank()) {
            throw new IllegalArgumentException("availability window " + fieldName + " time is required for day: " + day);
        }

        try {
            return LocalTime.parse(timeValue, TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("availability window " + fieldName + " time must be in HH:mm format for day: " + day);
        }
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