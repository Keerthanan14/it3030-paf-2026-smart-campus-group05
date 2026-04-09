package com.smartcampus.resource;

import com.smartcampus.booking.Booking;
import com.smartcampus.booking.BookingRepository;
import com.smartcampus.booking.BookingStatus;
import com.smartcampus.booking.BookingService;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.resource.dto.CreateResourceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceServiceImplTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private BookingService bookingService;

    @Mock
    private BookingRepository bookingRepository;

    private ResourceServiceImpl resourceService;

    @BeforeEach
    void setUp() {
        resourceService = new ResourceServiceImpl(resourceRepository, bookingService, bookingRepository);
    }

    @Test
    void resolveVisibleStatus_shouldForceActiveForNonAdmin() {
        ResourceStatus status = resourceService.resolveVisibleStatus("STUDENT", ResourceStatus.OUT_OF_SERVICE);
        assertEquals(ResourceStatus.ACTIVE, status);
    }

    @Test
    void resolveVisibleStatus_shouldAllowAdminRequestedStatus() {
        ResourceStatus status = resourceService.resolveVisibleStatus("ADMIN", ResourceStatus.OUT_OF_SERVICE);
        assertEquals(ResourceStatus.OUT_OF_SERVICE, status);
    }

    @Test
    void isResourceBookable_shouldReturnTrueForActiveResource() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));

        assertTrue(resourceService.isResourceBookable(id));
    }

    @Test
    void isResourceBookable_shouldReturnFalseForOutOfServiceResource() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));

        assertFalse(resourceService.isResourceBookable(id));
    }

    @Test
    void isResourceBookable_shouldReturnFalseWhenResourceMissing() {
        UUID id = UUID.randomUUID();

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.empty());

        assertFalse(resourceService.isResourceBookable(id));
    }

    @Test
    void updateResourceStatus_shouldTriggerAutoRejectWhenBecomingOutOfService() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setId(id);
        resource.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));
        when(resourceRepository.save(resource)).thenReturn(resource);

        resourceService.updateResourceStatus(id, ResourceStatus.OUT_OF_SERVICE);

        verify(bookingService).autoRejectPendingForResourceOutOfService(eq(id));
    }

    @Test
    void updateResourceStatus_shouldNotTriggerAutoRejectWhenStatusUnchangedOutOfService() {
        UUID id = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setId(id);
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);

        when(resourceRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(resource));
        when(resourceRepository.save(resource)).thenReturn(resource);

        resourceService.updateResourceStatus(id, ResourceStatus.OUT_OF_SERVICE);

        verify(bookingService, never()).autoRejectPendingForResourceOutOfService(eq(id));
    }

    @Test
    void getResourceAvailability_shouldReturnApprovedBookedSlotsInRange() {
        UUID resourceId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 7);

        Resource resource = new Resource();
        resource.setId(resourceId);
        resource.setName("Main Lab");
        resource.setAvailabilityWindows(Map.of());

        Booking booking = new Booking();
        booking.setBookingDate(LocalDate.of(2026, 4, 3));
        booking.setStartTime(LocalTime.of(9, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setPurpose("Seminar");

        when(resourceRepository.findByIdAndDeletedFalse(resourceId)).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResource_IdAndStatusAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
            resourceId,
            BookingStatus.PENDING,
            from,
            to
        )).thenReturn(List.of());
        when(bookingRepository.findByResource_IdAndStatusAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                resourceId,
                BookingStatus.APPROVED,
                from,
                to
        )).thenReturn(List.of(booking));

        var result = resourceService.getResourceAvailability(resourceId, from, to);

        assertEquals(1, result.bookedSlots().size());
        assertEquals("2026-04-03", result.bookedSlots().getFirst().date());
        assertEquals("09:00", result.bookedSlots().getFirst().startTime());
        assertEquals("11:00", result.bookedSlots().getFirst().endTime());
        assertEquals("Seminar", result.bookedSlots().getFirst().purpose());
    }

    @Test
    void getResourceAvailability_shouldThrowWhenFromAfterTo() {
        UUID resourceId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 4, 10);
        LocalDate to = LocalDate.of(2026, 4, 1);

        assertThrows(IllegalArgumentException.class,
                () -> resourceService.getResourceAvailability(resourceId, from, to));
    }

    @Test
    void softDeleteResource_shouldThrowConflictWhenFutureApprovedBookingsExist() {
        UUID resourceId = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setId(resourceId);

        when(resourceRepository.findByIdAndDeletedFalse(resourceId)).thenReturn(Optional.of(resource));
        when(bookingRepository.existsByResource_IdAndStatusAndBookingDateGreaterThanEqual(
                resourceId,
                BookingStatus.APPROVED,
                LocalDate.now()
        )).thenReturn(true);

        assertThrows(ConflictException.class, () -> resourceService.softDeleteResource(resourceId));

        verify(resourceRepository, never()).save(resource);
    }

    @Test
    void createResource_shouldThrowWhenAvailabilityWindowTimesAreInvalid() {
        AvailabilityWindow invalidWindow = new AvailabilityWindow();
        invalidWindow.setOpen("17:00");
        invalidWindow.setClose("09:00");

        CreateResourceRequest request = new CreateResourceRequest(
                "Main Lab",
                ResourceType.LAB,
                40,
            "MAIN",
            2,
            40,
            20,
            true,
            true,
            true,
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            40,
            0,
                "Lab",
                Map.of("MONDAY", invalidWindow),
                true,
                true
        );

        assertThrows(IllegalArgumentException.class, () -> resourceService.createResource(request));
    }

    @Test
    void createResource_shouldThrowWhenAvailabilityWindowFormatIsInvalid() {
        AvailabilityWindow invalidWindow = new AvailabilityWindow();
        invalidWindow.setOpen("9:00");
        invalidWindow.setClose("17:00");

        CreateResourceRequest request = new CreateResourceRequest(
                "Main Lab",
                ResourceType.LAB,
                40,
            "MAIN",
            2,
            40,
            20,
            true,
            true,
            true,
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            40,
            0,
                "Lab",
                Map.of("MONDAY", invalidWindow),
                true,
                true        );

        assertThrows(IllegalArgumentException.class, () -> resourceService.createResource(request));
    }
}