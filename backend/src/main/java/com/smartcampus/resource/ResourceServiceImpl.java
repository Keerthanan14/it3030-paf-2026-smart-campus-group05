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
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

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
                                                  Boolean allowBookings,
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
                .and(ResourceSpecifications.hasStatus(resolvedStatus))
                .and(ResourceSpecifications.hasAllowBookings(allowBookings));

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
        int normalizedCapacity = normalizeCapacity(request.type(), request.capacity());

        Resource resource = new Resource();
        resource.setName(request.name());
        resource.setType(request.type());
        resource.setCapacity(normalizedCapacity);
        resource.setBuilding(request.building());
        resource.setFloor(request.floor());
        resource.setLocation(formatLocation(request.building(), request.floor()));
        resource.setChairCount(request.chairCount());
        resource.setTableCount(request.tableCount());
        resource.setPcCount(request.pcCount());
        resource.setEquipmentCount(request.equipmentCount());
        resource.setHasAc(request.hasAc());
        resource.setHasFan(request.hasFan());
        resource.setHasProjector(request.hasProjector());
        resource.setHasSmartboard(request.hasSmartboard());
        resource.setHasCamera(request.hasCamera());
        resource.setHasPodiumWithPc(Boolean.TRUE.equals(request.hasPodiumWithPc()));
        resource.setHasPodium(Boolean.TRUE.equals(request.hasPodium()));
        resource.setHasWhiteboard(Boolean.TRUE.equals(request.hasWhiteboard()));
        resource.setHasClock(Boolean.TRUE.equals(request.hasClock()));
        resource.setHasLectureChairs(Boolean.TRUE.equals(request.hasLectureChairs()));
        resource.setHasLectureDesks(Boolean.TRUE.equals(request.hasLectureDesks()));
        resource.setHasSpeakers(Boolean.TRUE.equals(request.hasSpeakers()));
        resource.setHasWifi(Boolean.TRUE.equals(request.hasWifi()));
        resource.setHasPowerOutlets(Boolean.TRUE.equals(request.hasPowerOutlets()));
        resource.setDescription(request.description());
        resource.setAvailabilityWindows(request.availabilityWindows());
        resource.setAllowBookings(Boolean.TRUE.equals(request.allowBookings()));
        resource.setAllowRequests(Boolean.TRUE.equals(request.allowRequests()));
        resource.setStatus(ResourceStatus.ACTIVE);

        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse updateResource(UUID id, UpdateResourceRequest request) {
        validateAvailabilityWindows(request.availabilityWindows());
        int normalizedCapacity = normalizeCapacity(request.type(), request.capacity());

        Resource resource = getExistingResource(id);
        resource.setName(request.name());
        resource.setType(request.type());
        resource.setCapacity(normalizedCapacity);
        resource.setBuilding(request.building());
        resource.setFloor(request.floor());
        resource.setLocation(formatLocation(request.building(), request.floor()));
        resource.setChairCount(request.chairCount());
        resource.setTableCount(request.tableCount());
        resource.setPcCount(request.pcCount());
        resource.setEquipmentCount(request.equipmentCount());
        resource.setHasAc(request.hasAc());
        resource.setHasFan(request.hasFan());
        resource.setHasProjector(request.hasProjector());
        resource.setHasSmartboard(request.hasSmartboard());
        resource.setHasCamera(request.hasCamera());
        resource.setHasPodiumWithPc(Boolean.TRUE.equals(request.hasPodiumWithPc()));
        resource.setHasPodium(Boolean.TRUE.equals(request.hasPodium()));
        resource.setHasWhiteboard(Boolean.TRUE.equals(request.hasWhiteboard()));
        resource.setHasClock(Boolean.TRUE.equals(request.hasClock()));
        resource.setHasLectureChairs(Boolean.TRUE.equals(request.hasLectureChairs()));
        resource.setHasLectureDesks(Boolean.TRUE.equals(request.hasLectureDesks()));
        resource.setHasSpeakers(Boolean.TRUE.equals(request.hasSpeakers()));
        resource.setHasWifi(Boolean.TRUE.equals(request.hasWifi()));
        resource.setHasPowerOutlets(Boolean.TRUE.equals(request.hasPowerOutlets()));
        resource.setDescription(request.description());
        resource.setAvailabilityWindows(request.availabilityWindows());
        resource.setAllowBookings(Boolean.TRUE.equals(request.allowBookings()));
        resource.setAllowRequests(Boolean.TRUE.equals(request.allowRequests()));
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

        List<ResourceAvailabilityResponse.BookedSlotResponse> bookedSlots = Stream.concat(
            bookingRepository
                .findByResource_IdAndStatusAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                    id,
                    BookingStatus.PENDING,
                    from,
                    to
                )
                .stream(),
            bookingRepository
                .findByResource_IdAndStatusAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                    id,
                    BookingStatus.APPROVED,
                    from,
                    to
                )
                .stream()
        )
            .sorted(Comparator.comparing(booking -> booking.getBookingDate().atTime(booking.getStartTime())))
            .map(booking -> new ResourceAvailabilityResponse.BookedSlotResponse(
                booking.getBookingDate().toString(),
                booking.getStartTime().toString(),
                booking.getEndTime().toString(),
            booking.getPurpose(),
            booking.getAttendeesCount()
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

    private int normalizeCapacity(ResourceType type, Integer capacity) {
        if (type == null) {
            throw new IllegalArgumentException("type is required");
        }

        if (type == ResourceType.EQUIPMENT) {
            return capacity == null ? 0 : capacity;
        }

        if (capacity == null || capacity < 1) {
            throw new IllegalArgumentException("capacity must be at least 1 for non-equipment resources");
        }

        return capacity;
    }

    private ResourceResponse toResponse(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getBuilding(),
                resource.getFloor(),
                resource.getLocation(),
                resource.getChairCount(),
                resource.getTableCount(),
                resource.getPcCount(),
                resource.getEquipmentCount(),
                resource.getHasAc(),
                resource.getHasFan(),
                resource.getHasProjector(),
                resource.getHasSmartboard(),
                resource.getHasCamera(),
                resource.getHasPodiumWithPc(),
                resource.getHasPodium(),
                resource.getHasWhiteboard(),
                resource.getHasClock(),
                resource.getHasLectureChairs(),
                resource.getHasLectureDesks(),
                resource.getHasSpeakers(),
                resource.getHasWifi(),
                resource.getHasPowerOutlets(),
                resource.getDescription(),
                resource.getAvailabilityWindows(),
                resource.getAllowBookings(),
                resource.getAllowRequests(),
                resource.getStatus(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }

    private String formatLocation(String building, Integer floor) {
        if (building == null || building.isBlank() || floor == null) {
            return "";
        }
        return building + " - Floor " + floor;
    }
}