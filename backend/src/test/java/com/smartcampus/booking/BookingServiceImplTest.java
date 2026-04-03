package com.smartcampus.booking;

import com.smartcampus.booking.dto.RejectBookingRequest;
import com.smartcampus.exception.BookingBadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingForbiddenException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.resource.AvailabilityWindow;
import com.smartcampus.resource.Resource;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.resource.ResourceStatus;
import com.smartcampus.resource.ResourceType;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private NotificationService notificationService;

    private BookingServiceImpl bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingServiceImpl(
                bookingRepository,
                userRepository,
                resourceRepository,
                notificationService
        );
    }

    @Test
    void getBookingById_shouldThrowNotFoundWhenBookingMissing() {
        UUID bookingId = UUID.randomUUID();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        assertThrows(BookingNotFoundException.class,
                () -> bookingService.getBookingById(bookingId, UUID.randomUUID(), "STUDENT"));
    }

    @Test
    void getBookingById_shouldThrowForbiddenWhenNonOwnerAndNotAdmin() {
        UUID bookingId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();

        Booking booking = newBooking(bookingId, ownerId, BookingStatus.PENDING);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThrows(BookingForbiddenException.class,
                () -> bookingService.getBookingById(bookingId, requesterId, "STUDENT"));
    }

    @Test
    void approveBooking_shouldThrowBadRequestWhenStatusIsNotPending() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = newBooking(bookingId, UUID.randomUUID(), BookingStatus.APPROVED);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThrows(BookingBadRequestException.class,
                () -> bookingService.approveBooking(bookingId));

        verify(notificationService, never()).sendBookingNotification(any(), any(), anyBoolean(), anyString());
    }

    @Test
    void approveBooking_shouldThrowConflictWhenSlotAlreadyTaken() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = newBooking(bookingId, UUID.randomUUID(), BookingStatus.PENDING);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(resourceRepository.findByIdAndDeletedFalse(booking.getResource().getId()))
            .thenReturn(Optional.of(booking.getResource()));
        when(bookingRepository.findConflictingBookingsExcludingId(
                eq(booking.getResource().getId()),
                eq(booking.getBookingDate()),
                eq(BookingStatus.APPROVED),
                eq(booking.getStartTime()),
                eq(booking.getEndTime()),
                eq(booking.getId())
        )).thenReturn(List.of(new Booking()));

        assertThrows(BookingConflictException.class,
                () -> bookingService.approveBooking(bookingId));

        verify(notificationService, never()).sendBookingNotification(any(), any(), anyBoolean(), anyString());
    }

    @Test
    void rejectBooking_shouldThrowNotFoundWhenBookingMissing() {
        UUID bookingId = UUID.randomUUID();
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        assertThrows(BookingNotFoundException.class,
                () -> bookingService.rejectBooking(bookingId, new RejectBookingRequest("Resource unavailable due to exam")));
    }

        @Test
        void createBooking_shouldThrowBadRequestWhenAttendeesMissingForRoom() {
        UUID userId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);

        Resource resource = new Resource();
        resource.setId(resourceId);
        resource.setType(ResourceType.ROOM);
        resource.setCapacity(30);
        resource.setStatus(ResourceStatus.ACTIVE);
        resource.setDeleted(false);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(resourceRepository.findByIdAndDeletedFalse(resourceId)).thenReturn(Optional.of(resource));

        assertThrows(BookingBadRequestException.class,
            () -> bookingService.createBooking(
                new com.smartcampus.booking.dto.CreateBookingRequest(
                    resourceId,
                    LocalDate.now().plusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    "Project meeting",
                    null
                ),
                userId
            ));
        }

        @Test
        void createBooking_shouldThrowBadRequestWhenOutsideAvailabilityWindow() {
        UUID userId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);

        Resource resource = new Resource();
        resource.setId(resourceId);
        resource.setType(ResourceType.ROOM);
        resource.setCapacity(30);
        resource.setStatus(ResourceStatus.ACTIVE);
        resource.setDeleted(false);

        AvailabilityWindow mondayWindow = new AvailabilityWindow();
        mondayWindow.setOpen("08:00");
        mondayWindow.setClose("17:00");

        Map<String, AvailabilityWindow> windows = new HashMap<>();
        windows.put("monday", mondayWindow);
        resource.setAvailabilityWindows(windows);

        LocalDate mondayDate = LocalDate.of(2026, 4, 6);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(resourceRepository.findByIdAndDeletedFalse(resourceId)).thenReturn(Optional.of(resource));

        assertThrows(BookingBadRequestException.class,
            () -> bookingService.createBooking(
                new com.smartcampus.booking.dto.CreateBookingRequest(
                    resourceId,
                    mondayDate,
                    LocalTime.of(18, 0),
                    LocalTime.of(19, 0),
                    "Project meeting",
                    5
                ),
                userId
            ));
        }

    @Test
    void autoRejectPendingForResourceOutOfService_shouldRejectAllPendingAndNotify() {
        UUID resourceId = UUID.randomUUID();
        Booking first = newBooking(UUID.randomUUID(), UUID.randomUUID(), BookingStatus.PENDING);
        first.setResource(newResource(resourceId));

        Booking second = newBooking(UUID.randomUUID(), UUID.randomUUID(), BookingStatus.PENDING);
        second.setResource(newResource(resourceId));

        when(bookingRepository.findByResource_IdAndStatus(resourceId, BookingStatus.PENDING))
                .thenReturn(List.of(first, second));

        int updatedCount = bookingService.autoRejectPendingForResourceOutOfService(resourceId);

        org.junit.jupiter.api.Assertions.assertEquals(2, updatedCount);
        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.REJECTED, first.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("Resource is out of service.", first.getRejectionReason());
        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.REJECTED, second.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("Resource is out of service.", second.getRejectionReason());

        verify(bookingRepository).saveAll(List.of(first, second));
        verify(notificationService, times(2)).sendBookingNotification(any(), any(), eq(false), eq("Resource is out of service."));
    }

    private Resource newResource(UUID id) {
        Resource resource = new Resource();
        resource.setId(id);
        resource.setName("Lab A");
        resource.setType(ResourceType.LAB);
        resource.setCapacity(40);
        resource.setStatus(ResourceStatus.ACTIVE);
        resource.setDeleted(false);
        return resource;
    }

    private Booking newBooking(UUID bookingId, UUID ownerId, BookingStatus status) {
        User owner = new User();
        owner.setId(ownerId);
        owner.setName("Owner");

        Resource resource = newResource(UUID.randomUUID());

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setUser(owner);
        booking.setResource(resource);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setPurpose("Project discussion");
        booking.setStatus(status);

        return booking;
    }
}
