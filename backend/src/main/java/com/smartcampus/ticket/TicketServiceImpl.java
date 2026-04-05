package com.smartcampus.ticket;

import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.TicketNotFoundException;
import com.smartcampus.resource.Resource;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.ticket.dto.AssignTicketRequest;
import com.smartcampus.ticket.dto.CreateTicketRequest;
import com.smartcampus.ticket.dto.PaginatedTicketResponse;
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

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             ResourceRepository resourceRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedTicketResponse getTickets(UUID requesterUserId,
                                              String requesterRole,
                                              TicketStatus status,
                                              TicketPriority priority,
                                              String category,
                                              UUID assignedTo,
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

        Page<TicketResponse> result = ticketRepository
                .findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);

        return new PaginatedTicketResponse(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId, UUID requesterUserId, String requesterRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + ticketId));

        enforceTicketAccess(ticket, requesterUserId, requesterRole);

        return toResponse(ticket);
    }

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, UUID requesterUserId, String requesterRole) {
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

        return toResponse(ticketRepository.save(ticket));
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

        return toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(UUID ticketId, AssignTicketRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + ticketId));

        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + request.technicianId()));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("Provided user is not a technician");
        }

        ticket.setAssignedTo(technician);

        return toResponse(ticketRepository.save(ticket));
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

    private TicketResponse toResponse(Ticket ticket) {
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
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
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
