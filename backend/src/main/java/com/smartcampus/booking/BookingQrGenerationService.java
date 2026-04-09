package com.smartcampus.booking;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class BookingQrGenerationService {

    private final BookingRepository bookingRepository;
    private final QRCodeService qrCodeService;

    public BookingQrGenerationService(BookingRepository bookingRepository, QRCodeService qrCodeService) {
        this.bookingRepository = bookingRepository;
        this.qrCodeService = qrCodeService;
    }

    @Async
    @Transactional
    public void generateApprovedBookingQr(UUID bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking == null || booking.getStatus() != BookingStatus.APPROVED) {
                return;
            }

            String qrCodeUrl = qrCodeService.generateAndStoreQRCodeFromBookingSummaryImage(booking);
            booking.setQrCodeUrl(qrCodeUrl);
            bookingRepository.save(booking);
        } catch (Exception ex) {
            System.err.println("Failed to generate QR for approved booking " + bookingId + ": " + ex.getMessage());
        }
    }
}
