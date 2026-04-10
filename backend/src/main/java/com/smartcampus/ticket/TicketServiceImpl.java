package com.smartcampus.ticket;

import com.smartcampus.audit.AuditLogService;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.TicketNotFoundException;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.resource.Resource;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.ticket.attachment.FileStorageService;
import com.smartcampus.ticket.attachment.TicketAttachment;
import com.smartcampus.ticket.attachment.TicketAttachmentRepository;
import com.smartcampus.ticket.comment.CommentRepository;
import com.smartcampus.ticket.dto.AssignTicketRequest;
import com.smartcampus.ticket.dto.CommentResponse;
import com.smartcampus.ticket.dto.CreateTicketRequest;
import com.smartcampus.ticket.dto.PaginatedTicketResponse;
import com.smartcampus.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.ticket.dto.TicketResponse;
import com.smartcampus.ticket.dto.UpdateTicketStatusRequest;
import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final CommentRepository commentRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             ResourceRepository resourceRepository,
                             TicketAttachmentRepository ticketAttachmentRepository,
                             CommentRepository commentRepository,
                             FileStorageService fileStorageService,
                             AuditLogService auditLogService,
                             NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.ticketAttachmentRepository = ticketAttachmentRepository;
        this.commentRepository = commentRepository;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedTicketResponse getTickets(UUID requesterUserId,
                                              String requesterRole,
                                              TicketStatus status,
                                              TicketPriority priority,
                                              String category,
                                              UUID assignedTo,
                                                  Boolean slaBreached,
                                              int page,
                                              int size) {
        validatePageParams(page, size);

        Specification<Ticket> spec = Specification.where(TicketSpecifications.hasStatus(status))
                .and(TicketSpecifications.hasPriority(priority))
            .and(TicketSpecifications.hasCategory(category));

        if (isAdminRole(requesterRole)) {
            spec = spec.and(TicketSpecifications.hasAssignedTo(assignedTo));
        } else if (isTechnicianRole(requesterRole)) {
            spec = spec.and(TicketSpecifications.hasAssignedTo(requesterUserId));
        } else {
            spec = spec.and(TicketSpecifications.hasUserId(requesterUserId));
        }

        if (slaBreached == null) {
            Page<TicketResponse> result = ticketRepository
                .findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(ticket -> toResponse(ticket, requesterUserId, requesterRole));

            return new PaginatedTicketResponse(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
            );
        }

        List<Ticket> all = ticketRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Ticket> filtered = new ArrayList<>();
        for (Ticket ticket : all) {
            if (isSlaBreached(ticket) == slaBreached) {
            filtered.add(ticket);
            }
        }

        int total = filtered.size();
        int fromIndex = page * size;
        if (fromIndex >= total) {
            return new PaginatedTicketResponse(List.of(), total, (int) Math.ceil((double) total / size), page, size);
        }
        int toIndex = Math.min(fromIndex + size, total);
        List<TicketResponse> content = filtered.subList(fromIndex, toIndex)
            .stream()
            .map(ticket -> toResponse(ticket, requesterUserId, requesterRole))
            .toList();

        return new PaginatedTicketResponse(
            content,
            total,
            (int) Math.ceil((double) total / size),
            page,
            size
        );
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId, UUID requesterUserId, String requesterRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + ticketId));

        enforceTicketAccess(ticket, requesterUserId, requesterRole);

        return toResponse(ticket, requesterUserId, requesterRole);
    }

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request,
                                       List<MultipartFile> images,
                                       UUID requesterUserId,
                                       String requesterRole) {
        if (!isAdminRole(requesterRole) && !isStudentRole(requesterRole)) {
            throw new ForbiddenException("Only students and admins can create tickets");
        }

        User owner = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + requesterUserId));

        Resource resource = null;
        if (request.resourceId() != null) {
            resource = resourceRepository.findByIdAndDeletedFalse(request.resourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + request.resourceId()));
        }

        Ticket ticket = new Ticket();
        ticket.setUser(owner);
        ticket.setResource(resource);
        ticket.setCategory(request.category().trim());
        ticket.setDescription(request.description().trim());
        ticket.setPriority(request.priority());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPreferredContact(request.preferredContact());

        Ticket savedTicket = ticketRepository.save(ticket);
        saveAttachments(savedTicket, images);

        auditLogService.logAction(
            requesterUserId,
            "CREATE",
            "TICKET",
            savedTicket.getId(),
            null,
            Map.of(
                "status", savedTicket.getStatus().name(),
                "priority", savedTicket.getPriority().name(),
                "category", savedTicket.getCategory()
            )
        );

            notificationService.sendTicketCreatedNotification(
                savedTicket.getUser().getId(),
                savedTicket.getId(),
                savedTicket.getPriority() == null ? null : savedTicket.getPriority().name()
            );

            notificationService.sendTicketCreatedNotificationToAdmins(
                savedTicket.getId(),
                savedTicket.getPriority() == null ? null : savedTicket.getPriority().name(),
                savedTicket.getUser().getId()
            );

        return toResponse(savedTicket, requesterUserId, requesterRole);
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(UUID ticketId,
                                             UpdateTicketStatusRequest request,
                                             UUID requesterUserId,
                                             String requesterRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + ticketId));

        if (isTechnicianRole(requesterRole)) {
            if (ticket.getAssignedTo() == null || !requesterUserId.equals(ticket.getAssignedTo().getId())) {
                throw new ForbiddenException("Technicians can update only their assigned tickets");
            }
            if (request.status() != TicketStatus.IN_PROGRESS && request.status() != TicketStatus.RESOLVED) {
                throw new ForbiddenException("Technicians can only move tickets to IN_PROGRESS or RESOLVED");
            }
        }

        validateTransition(ticket.getStatus(), request.status(), requesterRole);

        if (request.status() == TicketStatus.RESOLVED && isBlank(request.resolutionNotes())) {
            throw new IllegalArgumentException("resolutionNotes is required when status is RESOLVED");
        }

        if (request.status() == TicketStatus.REJECTED && isBlank(request.rejectionReason())) {
            throw new IllegalArgumentException("rejectionReason is required when status is REJECTED");
        }

        TicketStatus previousStatus = ticket.getStatus();

        if (ticket.getFirstResponseAt() == null && ticket.getStatus() == TicketStatus.OPEN && request.status() != TicketStatus.OPEN) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

        if (request.status() == TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        ticket.setStatus(request.status());

        if (request.status() == TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(request.resolutionNotes() == null ? null : request.resolutionNotes().trim());
        }

        if (request.status() == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.rejectionReason().trim());
        } else {
            ticket.setRejectionReason(null);
        }

        Ticket saved = ticketRepository.save(ticket);

        auditLogService.logAction(
                requesterUserId,
                "STATUS_CHANGE",
                "TICKET",
                saved.getId(),
                Map.of("status", previousStatus.name()),
                Map.of("status", saved.getStatus().name())
        );

        notificationService.sendTicketStatusNotification(saved.getUser().getId(), saved.getId(), saved.getStatus().name());

        return toResponse(saved, requesterUserId, requesterRole);
    }

    @Override
    @Transactional
        public TicketResponse assignTicket(UUID ticketId,
                           AssignTicketRequest request,
                           UUID requesterUserId,
                           String requesterRole) {
            if (!isAdminRole(requesterRole)) {
                throw new ForbiddenException("Only admins can assign technicians to tickets");
            }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + ticketId));

        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + request.technicianId()));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("Provided user is not a technician");
        }

        UUID previousAssignedTo = ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId();
        ticket.setAssignedTo(technician);

        Ticket saved = ticketRepository.save(ticket);

        auditLogService.logAction(
            requesterUserId,
            "ASSIGN",
            "TICKET",
            saved.getId(),
            Map.of("assignedTo", previousAssignedTo == null ? "UNASSIGNED" : previousAssignedTo.toString()),
            Map.of("assignedTo", saved.getAssignedTo().getId().toString())
        );

        return toResponse(saved, requesterUserId, requesterRole);
    }

    private void validatePageParams(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }
    }

    private void enforceTicketAccess(Ticket ticket, UUID requesterUserId, String requesterRole) {
        if (isAdminRole(requesterRole)) {
            return;
        }

        if (isTechnicianRole(requesterRole)) {
            if (ticket.getAssignedTo() == null || !requesterUserId.equals(ticket.getAssignedTo().getId())) {
                throw new ForbiddenException("You are not allowed to access this ticket");
            }
            return;
        }

        if (!requesterUserId.equals(ticket.getUser().getId())) {
            throw new ForbiddenException("You are not allowed to access this ticket");
        }
    }

    private void validateTransition(TicketStatus currentStatus, TicketStatus nextStatus, String requesterRole) {
        if (currentStatus == TicketStatus.CLOSED || currentStatus == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Terminal ticket status cannot be changed");
        }

        boolean allowed = switch (currentStatus) {
            case OPEN -> nextStatus == TicketStatus.IN_PROGRESS || nextStatus == TicketStatus.REJECTED;
            case IN_PROGRESS -> nextStatus == TicketStatus.RESOLVED || nextStatus == TicketStatus.REJECTED;
            case RESOLVED -> nextStatus == TicketStatus.CLOSED;
            default -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException("Invalid status transition: " + currentStatus + " -> " + nextStatus);
        }

        if (nextStatus == TicketStatus.REJECTED && !isAdminRole(requesterRole)) {
            throw new ForbiddenException("Only admins can reject tickets");
        }

        if (nextStatus == TicketStatus.CLOSED && !isAdminRole(requesterRole)) {
            throw new ForbiddenException("Only admins can close tickets");
        }
    }

    private TicketResponse toResponse(Ticket ticket, UUID requesterUserId, String requesterRole) {
        List<TicketAttachmentResponse> attachments = ticketAttachmentRepository.findByTicket_Id(ticket.getId())
            .stream()
            .map(attachment -> new TicketAttachmentResponse(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getFileUrl(),
                attachment.getFileSize(),
                attachment.getCreatedAt()
            ))
            .toList();

        List<CommentResponse> comments = commentRepository.findByTicket_IdOrderByCreatedAtAsc(ticket.getId())
            .stream()
            .map(comment -> new CommentResponse(
                comment.getId(),
                comment.getTicket().getId(),
                comment.getUser().getId(),
                comment.getUser().getName(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
            ))
            .toList();

        Map<String, String> links = buildLinks(ticket, requesterUserId, requesterRole);

        return new TicketResponse(
                ticket.getId(),
                ticket.getUser().getId(),
                ticket.getUser().getName(),
                ticket.getResource() == null ? null : ticket.getResource().getId(),
                ticket.getResource() == null ? null : ticket.getResource().getName(),
                ticket.getCategory(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId(),
                ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getName(),
                ticket.getResolutionNotes(),
                ticket.getRejectionReason(),
                ticket.getPreferredContact(),
                ticket.getFirstResponseAt(),
                ticket.getResolvedAt(),
                computeTimeToFirstResponse(ticket),
                computeTimeToResolution(ticket),
                isFirstResponseBreached(ticket),
                isResolutionBreached(ticket),
                links,
                attachments,
                comments,
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }

    private Map<String, String> buildLinks(Ticket ticket, UUID requesterUserId, String requesterRole) {
        Map<String, String> links = new HashMap<>();

        String base = "/api/tickets/" + ticket.getId();
        links.put("self", base);

        boolean isAdmin = isAdminRole(requesterRole);
        boolean isTechnician = isTechnicianRole(requesterRole);
        boolean isOwner = requesterUserId != null && requesterUserId.equals(ticket.getUser().getId());
        boolean assignedTech = isTechnician && ticket.getAssignedTo() != null && requesterUserId.equals(ticket.getAssignedTo().getId());

        if (isAdmin) {
            links.put("assign", base + "/assign");
        }

        if ((isAdmin || assignedTech) && ticket.getStatus() != TicketStatus.CLOSED && ticket.getStatus() != TicketStatus.REJECTED) {
            links.put("updateStatus", base + "/status");
        }

        if (isAdmin || isOwner || assignedTech) {
            links.put("addComment", base + "/comments");
        }

        return links;
    }

    private String computeTimeToFirstResponse(Ticket ticket) {
        if (ticket.getFirstResponseAt() == null) {
            return null;
        }
        return formatDuration(Duration.between(ticket.getCreatedAt(), ticket.getFirstResponseAt()));
    }

    private String computeTimeToResolution(Ticket ticket) {
        if (ticket.getResolvedAt() == null) {
            return null;
        }
        return formatDuration(Duration.between(ticket.getCreatedAt(), ticket.getResolvedAt()));
    }

    private boolean isFirstResponseBreached(Ticket ticket) {
        LocalDateTime end = ticket.getFirstResponseAt() == null ? LocalDateTime.now() : ticket.getFirstResponseAt();
        long hours = Duration.between(ticket.getCreatedAt(), end).toHours();
        return hours > TicketSlaConstants.FIRST_RESPONSE_TARGET_HOURS;
    }

    private boolean isResolutionBreached(Ticket ticket) {
        LocalDateTime end = ticket.getResolvedAt() == null ? LocalDateTime.now() : ticket.getResolvedAt();
        long hours = Duration.between(ticket.getCreatedAt(), end).toHours();
        return hours > TicketSlaConstants.RESOLUTION_TARGET_HOURS;
    }

    private boolean isSlaBreached(Ticket ticket) {
        return isFirstResponseBreached(ticket) || isResolutionBreached(ticket);
    }

    private String formatDuration(Duration duration) {
        long minutes = duration.toMinutes();
        long hoursPart = minutes / 60;
        long minutesPart = minutes % 60;
        return hoursPart + "h " + minutesPart + "m";
    }

    private void saveAttachments(Ticket ticket, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        List<MultipartFile> nonEmpty = images.stream().filter(file -> file != null && !file.isEmpty()).toList();
        if (nonEmpty.isEmpty()) {
            return;
        }

        if (nonEmpty.size() > 3) {
            throw new IllegalArgumentException("A maximum of 3 images can be uploaded");
        }

        List<TicketAttachment> attachments = nonEmpty.stream()
                .map(file -> {
                    FileStorageService.StoredFile stored = fileStorageService.storeTicketImage(file);

                    TicketAttachment attachment = new TicketAttachment();
                    attachment.setTicket(ticket);
                    attachment.setFileName(stored.originalFileName());
                    attachment.setStoredName(stored.storedName());
                    attachment.setFileUrl(stored.fileUrl());
                    attachment.setFileSize(stored.size());
                    return attachment;
                })
                .toList();

        ticketAttachmentRepository.saveAll(attachments);
    }

    private boolean isAdminRole(String role) {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private boolean isTechnicianRole(String role) {
        return "TECHNICIAN".equalsIgnoreCase(role) || "ROLE_TECHNICIAN".equalsIgnoreCase(role);
    }

    private boolean isStudentRole(String role) {
        return "STUDENT".equalsIgnoreCase(role) || "ROLE_STUDENT".equalsIgnoreCase(role);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
