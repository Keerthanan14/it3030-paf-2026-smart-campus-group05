package com.smartcampus.booking;

import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.dto.CreateBookingRequest;
import com.smartcampus.booking.dto.PaginatedBookingResponse;
import com.smartcampus.booking.dto.RejectBookingRequest;

import java.time.LocalDate;
import java.util.UUID;

public interface BookingService {

    PaginatedBookingResponse getBookings(UUID requesterUserId,
                                         String requesterRole,
                                         BookingStatus status,
                                         UUID resourceId,
                                         LocalDate from,
                                         LocalDate to,
                                         int page,
                                         int size);

    BookingResponse getBookingById(UUID bookingId, UUID requesterUserId, String requesterRole);

    BookingResponse createBooking(CreateBookingRequest request, UUID requesterUserId);

    BookingResponse approveBooking(UUID bookingId);

    BookingResponse rejectBooking(UUID bookingId, RejectBookingRequest request);

    BookingResponse cancelBooking(UUID bookingId, UUID requesterUserId);

    BookingResponse updateBookingQrFromSummaryImage(UUID bookingId, String imageDataUrl, UUID requesterUserId, String requesterRole);

    int autoRejectPendingForResourceOutOfService(UUID resourceId);

    byte[] exportBookingsPdf(BookingStatus status, UUID resourceId, LocalDate from, LocalDate to);

    byte[] exportBookingsExcel(BookingStatus status, UUID resourceId, LocalDate from, LocalDate to);
}
