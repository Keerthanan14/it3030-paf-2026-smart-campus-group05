package com.smartcampus.booking;

import com.smartcampus.audit.AuditLogService;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.dto.CreateBookingRequest;
import com.smartcampus.booking.dto.PaginatedBookingResponse;
import com.smartcampus.booking.dto.RejectBookingRequest;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.smartcampus.exception.BookingBadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingForbiddenException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.exception.ResourceNotFoundException;
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

    public BookingServiceImpl(BookingRepository bookingRepository,
                              UserRepository userRepository,
                              ResourceRepository resourceRepository,
                              NotificationService notificationService,
                              AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
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
            result.getSize(),
            null
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
        Booking saved = bookingRepository.save(booking);

        logBookingStatusChange(
            resolveAuthenticatedUserId(),
            "APPROVE",
            saved,
            previousStatus,
            saved.getStatus()
        );

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

            String rangeLabel = (from == null && to == null)
                    ? "All Dates"
                    : (from == null ? "Until " + to : (to == null ? "From " + from : from + " to " + to));

            document.add(new Paragraph("Booking Report").setFontSize(16));
            document.add(new Paragraph("Date Range: " + rangeLabel));
            document.add(new Paragraph("Generated At: " + java.time.LocalDateTime.now()));
            document.add(new Paragraph(" "));

            Table table = new Table(UnitValue.createPercentArray(new float[]{1.3f, 1.4f, 1.4f, 1f, 0.8f, 0.8f, 1.6f, 0.8f, 1f, 1.6f}))
                    .useAllAvailableWidth();

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

            for (Booking booking : bookings) {
                table.addCell(trimBookingId(booking.getId()));
                table.addCell(booking.getUser().getName());
                table.addCell(booking.getResource().getName());
                table.addCell(String.valueOf(booking.getBookingDate()));
                table.addCell(String.valueOf(booking.getStartTime()));
                table.addCell(String.valueOf(booking.getEndTime()));
                table.addCell(booking.getPurpose());
                table.addCell(booking.getAttendeesCount() == null ? "-" : String.valueOf(booking.getAttendeesCount()));
                table.addCell(booking.getStatus().name());
                table.addCell(booking.getRejectionReason() == null ? "-" : booking.getRejectionReason());
            }

            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Total bookings: " + bookings.size()));
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
        table.addHeaderCell(new Cell().add(new Paragraph(value)));
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
            if (attendeesCount != null && attendeesCount > resource.getCapacity()) {
                throw new BookingBadRequestException("attendeesCount cannot exceed resource capacity");
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

        String dayName = bookingDate.getDayOfWeek().name().toLowerCase(Locale.ROOT);
        AvailabilityWindow window = windows.get(dayName);
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
                booking.getUpdatedAt(),
                null
        );
    }
}
