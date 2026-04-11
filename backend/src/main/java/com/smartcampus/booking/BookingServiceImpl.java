package com.smartcampus.booking;

import com.smartcampus.audit.AuditLogService;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.dto.CreateBookingRequest;
import com.smartcampus.booking.dto.PaginatedBookingResponse;
import com.smartcampus.booking.dto.RejectBookingRequest;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.smartcampus.exception.BookingBadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingForbiddenException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.notification.EmailService;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.resource.AvailabilityWindow;
import com.smartcampus.resource.Resource;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.resource.ResourceStatus;
import com.smartcampus.resource.ResourceType;
import com.smartcampus.security.AuthUserPrincipal;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class BookingServiceImpl implements BookingService {

    private static final String OUT_OF_SERVICE_REJECTION_REASON = "Resource is out of service.";
    private static final String BOOKING_ENTITY_TYPE = "BOOKING";

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final QRCodeService qrCodeService;
    private final BookingQrGenerationService bookingQrGenerationService;
    private final EmailService emailService;
    private final String baseUrl;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              UserRepository userRepository,
                              ResourceRepository resourceRepository,
                              NotificationService notificationService,
                              AuditLogService auditLogService,
                              QRCodeService qrCodeService,
                              BookingQrGenerationService bookingQrGenerationService,
                              EmailService emailService,
                              @Value("${app.base-url:http://localhost:8080}") String baseUrl) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.qrCodeService = qrCodeService;
        this.bookingQrGenerationService = bookingQrGenerationService;
        this.emailService = emailService;
        this.baseUrl = baseUrl;
    }

    @Override
    @Transactional(readOnly = true)
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
            result.getSize(),
            null
        );
    }

    @Override
    @Transactional(readOnly = true)
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

        Resource resource = resourceRepository.findByIdAndDeletedFalseForUpdate(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + request.resourceId()));

        if (!isResourceBookable(resource)) {
            throw new BookingConflictException(OUT_OF_SERVICE_REJECTION_REASON);
        }

        validateAttendeesCount(resource, request.attendeesCount());
        validateWithinAvailabilityWindow(resource, request.bookingDate(), request.startTime(), request.endTime());

        boolean hasConflict = hasLockedConflict(
            resource.getId(),
            request.bookingDate(),
            request.startTime(),
            request.endTime()
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

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.sendBookingCreatedNotification(savedBooking.getUser().getId(), savedBooking.getId());
        return toResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse approveBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingBadRequestException("Only PENDING bookings can be approved");
        }

        Resource latestResource = resourceRepository.findByIdAndDeletedFalseForUpdate(booking.getResource().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + booking.getResource().getId()));

        if (!isResourceBookable(latestResource)) {
            throw new BookingConflictException("Cannot approve booking. Resource is out of service.");
        }

        validateWithinAvailabilityWindow(
            latestResource,
            booking.getBookingDate(),
            booking.getStartTime(),
            booking.getEndTime()
        );

        boolean hasConflict = hasLockedConflictExcludingCurrent(
            booking.getResource().getId(),
            booking.getBookingDate(),
            booking.getStartTime(),
            booking.getEndTime(),
            booking.getId()
        );

        if (hasConflict) {
            throw new BookingConflictException("Cannot approve booking due to schedule conflict");
        }

        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.APPROVED);
        booking.setRejectionReason(null);
        booking.setQrCodeUrl(null);

        Booking saved = bookingRepository.save(booking);

        String qrCodeUrl = bookingQrGenerationService.generateApprovedBookingQr(saved.getId());
        if (qrCodeUrl != null) {
            saved.setQrCodeUrl(qrCodeUrl);
        }

        logBookingStatusChange(
            resolveAuthenticatedUserId(),
            "APPROVE",
            saved,
            previousStatus,
            saved.getStatus()
        );

        notificationService.sendBookingNotification(saved.getUser().getId(), saved.getId(), true, null);

        // Send booking confirmation email with QR code
        try {
            emailService.sendBookingConfirmation(
                saved.getUser().getEmail(),
                saved.getUser().getName(),
                saved.getResource().getName(),
                saved.getBookingDate(),
                saved.getStartTime(),
                saved.getEndTime(),
                saved.getId().toString(),
                qrCodeUrl,
                baseUrl
            );
        } catch (Exception e) {
            System.err.println("Failed to send booking confirmation email: " + e.getMessage());
            // Don't throw exception - email failure shouldn't fail the booking approval
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingQrFromSummaryImage(UUID bookingId, String imageDataUrl, UUID requesterUserId, String requesterRole) {
        if (!isAdminRole(requesterRole)) {
            throw new BookingForbiddenException("Only ADMIN can update booking QR image");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for id: " + bookingId));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BookingBadRequestException("QR image can be updated only for APPROVED bookings");
        }

        String qrCodeUrl = qrCodeService.generateAndStoreQRCodeFromBookingSummaryImage(booking);
        booking.setQrCodeUrl(qrCodeUrl);
        Booking saved = bookingRepository.save(booking);

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

        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(request.rejectionReason());
        Booking saved = bookingRepository.save(booking);

        logBookingStatusChange(
            resolveAuthenticatedUserId(),
            "REJECT",
            saved,
            previousStatus,
            saved.getStatus()
        );

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

        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        logBookingStatusChange(
                requesterUserId,
                "CANCEL",
                saved,
                previousStatus,
                saved.getStatus()
        );

        notificationService.sendBookingCancelledNotification(saved.getUser().getId(), saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public int autoRejectPendingForResourceOutOfService(UUID resourceId) {
        List<Booking> pendingBookings = bookingRepository.findByResource_IdAndStatus(resourceId, BookingStatus.PENDING);
        if (pendingBookings.isEmpty()) {
            return 0;
        }

        for (Booking booking : pendingBookings) {
            BookingStatus previousStatus = booking.getStatus();
            booking.setStatus(BookingStatus.REJECTED);
            booking.setRejectionReason(OUT_OF_SERVICE_REJECTION_REASON);
            notificationService.sendBookingNotification(
                    booking.getUser().getId(),
                    booking.getId(),
                    false,
                    OUT_OF_SERVICE_REJECTION_REASON
            );
            logBookingStatusChange(
                null,
                "AUTO_REJECT",
                booking,
                previousStatus,
                booking.getStatus()
            );
        }

        bookingRepository.saveAll(pendingBookings);
        return pendingBookings.size();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportBookingsPdf(BookingStatus status, UUID resourceId, LocalDate from, LocalDate to) {
        validateExportFilters(from, to);
        List<Booking> bookings = findBookingsForExport(status, resourceId, from, to);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.setMargins(28, 28, 28, 28);

            Color primary = new DeviceRgb(17, 24, 39);
            Color accent = new DeviceRgb(37, 99, 235);
            Color softBlue = new DeviceRgb(239, 246, 255);
            Color softGray = new DeviceRgb(243, 244, 246);
            Color borderColor = new DeviceRgb(209, 213, 219);
            Color successBg = new DeviceRgb(220, 252, 231);
            Color warningBg = new DeviceRgb(254, 243, 199);
            Color dangerBg = new DeviceRgb(254, 226, 226);

            String rangeLabel = (from == null && to == null)
                    ? "All Dates"
                    : (from == null ? "Until " + to : (to == null ? "From " + from : from + " to " + to));

                Paragraph title = new Paragraph()
                    .setFontSize(22)
                    .setFontColor(primary)
                    .setMarginBottom(2)
                        .add("Booking Report");
            Paragraph subtitle = new Paragraph("Admin export for managed booking records")
                .setFontSize(10)
                .setFontColor(new DeviceRgb(75, 85, 99))
                .setMarginBottom(14);

            Div headerBlock = new Div()
                .setBackgroundColor(softBlue)
                .setBorder(new SolidBorder(accent, 1))
                .setPadding(14)
                .setMarginBottom(14);
            headerBlock.add(title);
            headerBlock.add(subtitle);

            Table metadataTable = new Table(UnitValue.createPercentArray(new float[]{1f, 1f}))
                .useAllAvailableWidth();
            metadataTable.addCell(createMetaCell("Date Range", rangeLabel, softGray, borderColor));
            metadataTable.addCell(createMetaCell("Generated At", java.time.LocalDateTime.now().toString(), softGray, borderColor));
            metadataTable.setMarginBottom(14);

            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{1f, 1f, 1f, 1f}))
                .useAllAvailableWidth();
            summaryTable.addCell(createSummaryCell("Total", String.valueOf(bookings.size()), softGray, borderColor, primary));
            summaryTable.addCell(createSummaryCell(
                "Approved",
                String.valueOf(bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.APPROVED).count()),
                successBg,
                borderColor,
                new DeviceRgb(21, 128, 61)
            ));
            summaryTable.addCell(createSummaryCell(
                "Pending",
                String.valueOf(bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.PENDING).count()),
                warningBg,
                borderColor,
                new DeviceRgb(146, 64, 14)
            ));
            summaryTable.addCell(createSummaryCell(
                "Rejected",
                String.valueOf(bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.REJECTED).count()),
                dangerBg,
                borderColor,
                new DeviceRgb(153, 27, 27)
            ));
            summaryTable.setMarginBottom(16);

            document.add(headerBlock);
            document.add(metadataTable);
            document.add(summaryTable);

            Table table = new Table(UnitValue.createPercentArray(new float[]{1.15f, 1.3f, 1.3f, 0.95f, 0.75f, 0.75f, 1.6f, 0.8f, 0.95f, 1.4f}))
                    .useAllAvailableWidth();
            table.setBorder(new SolidBorder(borderColor, 1));

            addPdfHeaderCell(table, "Booking ID");
            addPdfHeaderCell(table, "User");
            addPdfHeaderCell(table, "Resource");
            addPdfHeaderCell(table, "Date");
            addPdfHeaderCell(table, "Start");
            addPdfHeaderCell(table, "End");
            addPdfHeaderCell(table, "Purpose");
            addPdfHeaderCell(table, "Attendees");
            addPdfHeaderCell(table, "Status");
            addPdfHeaderCell(table, "Rejection Reason");

            boolean alternate = false;
            for (Booking booking : bookings) {
                Color rowBackground = alternate ? new DeviceRgb(249, 250, 251) : ColorConstants.WHITE;
                table.addCell(createBodyCell(trimBookingId(booking.getId()), rowBackground, borderColor, TextAlignment.LEFT));
                table.addCell(createBodyCell(booking.getUser().getName(), rowBackground, borderColor, TextAlignment.LEFT));
                table.addCell(createBodyCell(booking.getResource().getName(), rowBackground, borderColor, TextAlignment.LEFT));
                table.addCell(createBodyCell(String.valueOf(booking.getBookingDate()), rowBackground, borderColor, TextAlignment.CENTER));
                table.addCell(createBodyCell(String.valueOf(booking.getStartTime()), rowBackground, borderColor, TextAlignment.CENTER));
                table.addCell(createBodyCell(String.valueOf(booking.getEndTime()), rowBackground, borderColor, TextAlignment.CENTER));
                table.addCell(createBodyCell(booking.getPurpose(), rowBackground, borderColor, TextAlignment.LEFT));
                table.addCell(createBodyCell(booking.getAttendeesCount() == null ? "-" : String.valueOf(booking.getAttendeesCount()), rowBackground, borderColor, TextAlignment.CENTER));
                table.addCell(createStatusCell(booking.getStatus().name(), rowBackground, borderColor, booking.getStatus()));
                table.addCell(createBodyCell(booking.getRejectionReason() == null ? "-" : booking.getRejectionReason(), rowBackground, borderColor, TextAlignment.LEFT));
                alternate = !alternate;
            }

            document.add(table);
            document.add(new Paragraph(" ").setMarginBottom(2));
            document.add(new Paragraph("Total bookings: " + bookings.size())
                    .setFontSize(10)
                    .setFontColor(new DeviceRgb(75, 85, 99)));
            document.close();

            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to generate PDF export", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportBookingsExcel(BookingStatus status, UUID resourceId, LocalDate from, LocalDate to) {
        validateExportFilters(from, to);
        List<Booking> bookings = findBookingsForExport(status, resourceId, from, to);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bookings Report");
            String[] headers = new String[]{
                    "Booking ID", "User", "Resource", "Date", "Start", "End", "Purpose", "Attendees", "Status", "Rejection Reason"
            };

            CellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = (XSSFFont) workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (Booking booking : bookings) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(trimBookingId(booking.getId()));
                row.createCell(1).setCellValue(booking.getUser().getName());
                row.createCell(2).setCellValue(booking.getResource().getName());
                row.createCell(3).setCellValue(String.valueOf(booking.getBookingDate()));
                row.createCell(4).setCellValue(String.valueOf(booking.getStartTime()));
                row.createCell(5).setCellValue(String.valueOf(booking.getEndTime()));
                row.createCell(6).setCellValue(booking.getPurpose());
                row.createCell(7).setCellValue(booking.getAttendeesCount() == null ? "-" : String.valueOf(booking.getAttendeesCount()));
                row.createCell(8).setCellValue(booking.getStatus().name());
                row.createCell(9).setCellValue(booking.getRejectionReason() == null ? "-" : booking.getRejectionReason());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to generate Excel export", ex);
        }
    }

    private boolean isAdminRole(String role) {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private List<Booking> findBookingsForExport(BookingStatus status, UUID resourceId, LocalDate from, LocalDate to) {
        Specification<Booking> spec = Specification
                .where(BookingSpecifications.hasStatus(status))
                .and(BookingSpecifications.hasResourceId(resourceId))
                .and(BookingSpecifications.bookingDateFrom(from))
                .and(BookingSpecifications.bookingDateTo(to));

        Sort sort = Sort.by(Sort.Direction.ASC, "bookingDate").and(Sort.by(Sort.Direction.ASC, "startTime"));
        return bookingRepository.findAll(spec, sort);
    }

    private void validateExportFilters(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BookingBadRequestException("from date must be before or equal to to date");
        }
    }

    private void addPdfHeaderCell(Table table, String value) {
        table.addHeaderCell(new Cell()
            .setBackgroundColor(new DeviceRgb(30, 41, 59))
            .setFontColor(ColorConstants.WHITE)
            .setBorder(new SolidBorder(new DeviceRgb(51, 65, 85), 0.8f))
            .setPadding(8)
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .add(new Paragraph().setFontSize(9.5f).add(value)));
        }

        private Cell createBodyCell(String value, Color backgroundColor, Color borderColor, TextAlignment alignment) {
        return new Cell()
            .setBackgroundColor(backgroundColor)
            .setBorder(new SolidBorder(borderColor, 0.6f))
            .setPadding(7)
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setTextAlignment(alignment)
            .add(new Paragraph(value).setFontSize(8.8f));
        }

        private Cell createStatusCell(String value, Color backgroundColor, Color borderColor, BookingStatus status) {
        Color textColor = switch (status) {
            case APPROVED -> new DeviceRgb(21, 128, 61);
            case PENDING -> new DeviceRgb(146, 64, 14);
            case REJECTED -> new DeviceRgb(153, 27, 27);
            case CANCELLED -> new DeviceRgb(71, 85, 105);
        };

        return new Cell()
            .setBackgroundColor(backgroundColor)
            .setBorder(new SolidBorder(borderColor, 0.6f))
            .setPadding(7)
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setTextAlignment(TextAlignment.CENTER)
            .add(new Paragraph()
                .setFontSize(8.8f)
                .setFontColor(textColor)
                .add(value));
        }

        private Cell createMetaCell(String label, String value, Color backgroundColor, Color borderColor) {
        return new Cell()
            .setBackgroundColor(backgroundColor)
            .setBorder(new SolidBorder(borderColor, 0.8f))
            .setPadding(8)
            .add(new Paragraph(label)
                .setFontSize(8)
                .setFontColor(new DeviceRgb(107, 114, 128))
                .setMarginBottom(2))
            .add(new Paragraph()
                .setFontSize(10)
                .setFontColor(new DeviceRgb(31, 41, 55))
                .add(value));
        }

        private Cell createSummaryCell(String label, String value, Color backgroundColor, Color borderColor, Color valueColor) {
        return new Cell()
            .setBackgroundColor(backgroundColor)
            .setBorder(new SolidBorder(borderColor, 0.8f))
            .setPadding(10)
            .setTextAlignment(TextAlignment.CENTER)
            .add(new Paragraph(label)
                .setFontSize(8)
                .setFontColor(new DeviceRgb(107, 114, 128))
                .setMarginBottom(2))
            .add(new Paragraph()
                .setFontSize(16)
                .setFontColor(valueColor)
                .add(value));
    }

    private String trimBookingId(UUID bookingId) {
        String id = bookingId.toString();
        return id.substring(0, Math.min(8, id.length()));
    }

    private UUID resolveAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthUserPrincipal authUserPrincipal) {
            return authUserPrincipal.userId();
        }

        return null;
    }

    private void logBookingStatusChange(UUID actorUserId,
                                        String action,
                                        Booking booking,
                                        BookingStatus oldStatus,
                                        BookingStatus newStatus) {
        auditLogService.logAction(
                actorUserId,
                action,
                BOOKING_ENTITY_TYPE,
                booking.getId(),
                Map.of("status", oldStatus.name()),
                Map.of(
                        "status", newStatus.name(),
                        "rejectionReason", booking.getRejectionReason() == null ? "" : booking.getRejectionReason()
                )
        );
    }

    private boolean isResourceBookable(Resource resource) {
        return resource.getStatus() == ResourceStatus.ACTIVE && !resource.isDeleted();
    }

    private boolean hasLockedConflict(UUID resourceId,
                                      LocalDate bookingDate,
                                      LocalTime startTime,
                                      LocalTime endTime) {
        try {
            return !bookingRepository.findConflictingBookingsForUpdate(
                    resourceId,
                    bookingDate,
                    BookingStatus.APPROVED,
                    startTime,
                    endTime
            ).isEmpty();
        } catch (PessimisticLockingFailureException ex) {
            throw new BookingConflictException("Booking is being processed by another request. Please retry.");
        }
    }

    private boolean hasLockedConflictExcludingCurrent(UUID resourceId,
                                                      LocalDate bookingDate,
                                                      LocalTime startTime,
                                                      LocalTime endTime,
                                                      UUID excludeBookingId) {
        try {
            return !bookingRepository.findConflictingBookingsExcludingIdForUpdate(
                    resourceId,
                    bookingDate,
                    BookingStatus.APPROVED,
                    startTime,
                    endTime,
                    excludeBookingId
            ).isEmpty();
        } catch (PessimisticLockingFailureException ex) {
            throw new BookingConflictException("Booking is being processed by another request. Please retry.");
        }
    }

    private void validateAttendeesCount(Resource resource, Integer attendeesCount) {
        if (resource.getType() == ResourceType.EQUIPMENT) {
            int equipmentLimit = resource.getEquipmentCount() != null && resource.getEquipmentCount() > 0
                    ? resource.getEquipmentCount()
                    : resource.getCapacity();

            if (attendeesCount != null && attendeesCount > equipmentLimit) {
                throw new BookingBadRequestException("count cannot exceed equipment quantity");
            }
            return;
        }

        if (attendeesCount == null) {
            throw new BookingBadRequestException("attendeesCount is required for ROOM and LAB resources");
        }

        if (attendeesCount > resource.getCapacity()) {
            throw new BookingBadRequestException("attendeesCount cannot exceed resource capacity");
        }
    }

    private void validateWithinAvailabilityWindow(Resource resource,
                                                  LocalDate bookingDate,
                                                  LocalTime startTime,
                                                  LocalTime endTime) {
        Map<String, AvailabilityWindow> windows = resource.getAvailabilityWindows();
        if (windows == null || windows.isEmpty()) {
            return;
        }

        String dayNameLower = bookingDate.getDayOfWeek().name().toLowerCase(Locale.ROOT);
        String dayNameUpper = bookingDate.getDayOfWeek().name();
        AvailabilityWindow window = windows.get(dayNameLower);
        if (window == null) {
            window = windows.get(dayNameUpper);
        }
        if (window == null) {
            throw new BookingBadRequestException("Requested time is outside resource availability windows");
        }

        LocalTime open = parseWindowTime(window.getOpen(), "open");
        LocalTime close = parseWindowTime(window.getClose(), "close");

        if (!startTime.isBefore(endTime)) {
            throw new BookingBadRequestException("endTime must be after startTime");
        }

        if (startTime.isBefore(open) || endTime.isAfter(close)) {
            throw new BookingBadRequestException("Requested time is outside resource availability windows");
        }
    }

    private LocalTime parseWindowTime(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BookingBadRequestException("Resource availability " + fieldName + " time is not configured");
        }

        try {
            return LocalTime.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new BookingBadRequestException("Resource availability " + fieldName + " time has invalid format");
        }
    }

    private String ensureQrCodeUrl(Booking booking) {
        if (booking.getStatus() != BookingStatus.APPROVED) {
            return null;
        }

        return booking.getQrCodeUrl();
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
                ensureQrCodeUrl(booking),
                booking.getCreatedAt(),
                booking.getUpdatedAt(),
                null
        );
    }
}
