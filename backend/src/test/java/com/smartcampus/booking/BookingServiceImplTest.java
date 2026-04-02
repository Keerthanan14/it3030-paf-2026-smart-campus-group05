package com.smartcampus.booking;

import com.smartcampus.booking.dto.RejectBookingRequest;
import com.smartcampus.exception.BookingBadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingForbiddenException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.resource.Resource;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.resource.ResourceService;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
    private ResourceService resourceService;

    @Mock
    private NotificationService notificationService;

    private BookingServiceImpl bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingServiceImpl(
                bookingRepository,
                userRepository,
                resourceRepository,
                resourceService,
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
        when(resourceService.isResourceBookable(booking.getResource().getId())).thenReturn(true);
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

    private Booking newBooking(UUID bookingId, UUID ownerId, BookingStatus status) {
        User owner = new User();
        owner.setId(ownerId);
        owner.setName("Owner");

        Resource resource = new Resource();
        resource.setId(UUID.randomUUID());
        resource.setName("Lab A");

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
