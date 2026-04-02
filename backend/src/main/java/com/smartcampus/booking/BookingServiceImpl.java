package com.smartcampus.booking;

import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.dto.CreateBookingRequest;
import com.smartcampus.booking.dto.PaginatedBookingResponse;
import com.smartcampus.booking.dto.RejectBookingRequest;
import com.smartcampus.exception.BookingBadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingForbiddenException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.resource.Resource;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.resource.ResourceService;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceService resourceService;
    private final NotificationService notificationService;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              UserRepository userRepository,
                              ResourceRepository resourceRepository,
                              ResourceService resourceService,
                              NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.resourceService = resourceService;
        this.notificationService = notificationService;
    }

    @Override
    public PaginatedBookingResponse getBookings(UUID requesterUserId,
                                                String requesterRole,
                                                BookingStatus status,
                                                UUID resourceId,
                                                LocalDate from,
                                                LocalDate to,
                                                int page,
                                                int size) {
        if (page < 0) {
            throw new BookingBadRequestException("page must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new BookingBadRequestException("size must be greater than 0");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new BookingBadRequestException("from date must be before or equal to to date");
        }

        Specification<Booking> spec = Specification.where(BookingSpecifications.hasStatus(status));

        if (isAdminRole(requesterRole)) {
            spec = spec.and(BookingSpecifications.hasResourceId(resourceId))
                    .and(BookingSpecifications.bookingDateFrom(from))
                    .and(BookingSpecifications.bookingDateTo(to));
        } else {
            spec = spec.and(BookingSpecifications.hasUserId(requesterUserId));
        }

        Page<BookingResponse> result = bookingRepository
                .findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);

        return new PaginatedBookingResponse(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }

    @Override
    public BookingResponse getBookingById(UUID bookingId, UUID requesterUserId, String requesterRole) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for id: " + bookingId));

        if (!isAdminRole(requesterRole) && !booking.getUser().getId().equals(requesterUserId)) {
            throw new BookingForbiddenException("You are not allowed to access this booking");
        }

        return toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, UUID requesterUserId) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw new BookingBadRequestException("endTime must be after startTime");
        }

        User bookingOwner = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new BookingNotFoundException("User not found for id: " + requesterUserId));

        Resource resource = resourceRepository.findByIdAndDeletedFalse(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + request.resourceId()));

        if (!resourceService.isResourceBookable(resource.getId())) {
            throw new BookingConflictException("Resource is out of service.");
        }

        boolean hasConflict = bookingRepository
                .existsByResource_IdAndBookingDateAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                        resource.getId(),
                        request.bookingDate(),
                        BookingStatus.APPROVED,
                        request.endTime(),
                        request.startTime()
                );

        if (hasConflict) {
            throw new BookingConflictException("Booking conflict detected for the selected slot");
        }

        Booking booking = new Booking();
        booking.setUser(bookingOwner);
        booking.setResource(resource);
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setPurpose(request.purpose());
        booking.setAttendeesCount(request.attendeesCount());
        booking.setStatus(BookingStatus.PENDING);

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public BookingResponse approveBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingBadRequestException("Only PENDING bookings can be approved");
        }

        if (!resourceService.isResourceBookable(booking.getResource().getId())) {
            throw new BookingConflictException("Cannot approve booking. Resource is out of service.");
        }

        boolean hasConflict = !bookingRepository.findConflictingBookingsExcludingId(
                booking.getResource().getId(),
                booking.getBookingDate(),
                BookingStatus.APPROVED,
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId()
        ).isEmpty();

        if (hasConflict) {
            throw new BookingConflictException("Cannot approve booking due to schedule conflict");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setRejectionReason(null);
        Booking saved = bookingRepository.save(booking);

        notificationService.sendBookingNotification(saved.getUser().getId(), saved.getId(), true, null);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse rejectBooking(UUID bookingId, RejectBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingBadRequestException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(request.rejectionReason());
        Booking saved = bookingRepository.save(booking);

        notificationService.sendBookingNotification(saved.getUser().getId(), saved.getId(), false, request.rejectionReason());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, UUID requesterUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for id: " + bookingId));

        if (!booking.getUser().getId().equals(requesterUserId)) {
            throw new BookingForbiddenException("You can only cancel your own booking");
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BookingBadRequestException("Only APPROVED bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    private boolean isAdminRole(String role) {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getUser().getId(),
                booking.getUser().getName(),
                booking.getResource().getId(),
                booking.getResource().getName(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getAttendeesCount(),
                booking.getStatus(),
                booking.getRejectionReason(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
