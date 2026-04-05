package com.smartcampus.ticket.comment;

import com.smartcampus.audit.AuditLogService;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.TicketNotFoundException;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.ticket.Ticket;
import com.smartcampus.ticket.TicketRepository;
import com.smartcampus.ticket.dto.CommentResponse;
import com.smartcampus.ticket.dto.CreateCommentRequest;
import com.smartcampus.ticket.dto.UpdateCommentRequest;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public CommentServiceImpl(CommentRepository commentRepository,
                              TicketRepository ticketRepository,
                              UserRepository userRepository,
                              AuditLogService auditLogService,
                              NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public CommentResponse createComment(UUID ticketId, CreateCommentRequest request, UUID requesterUserId, String requesterRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + ticketId));

        enforceCommentAccess(ticket, requesterUserId, requesterRole);

        User user = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + requesterUserId));

        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setUser(user);
        comment.setContent(request.content().trim());

        Comment saved = commentRepository.save(comment);

        auditLogService.logAction(
            requesterUserId,
            "CREATE",
            "COMMENT",
            saved.getId(),
            null,
            Map.of(
                "ticketId", saved.getTicket().getId().toString(),
                "content", saved.getContent()
            )
        );

        if (!saved.getUser().getId().equals(ticket.getUser().getId())) {
            notificationService.sendNewCommentNotification(
                    ticket.getUser().getId(),
                    ticket.getId(),
                    saved.getUser().getName()
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(UUID ticketId,
                                         UUID commentId,
                                         UpdateCommentRequest request,
                                         UUID requesterUserId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new TicketNotFoundException("Comment not found for id: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to the specified ticket");
        }

        if (!requesterUserId.equals(comment.getUser().getId())) {
            throw new ForbiddenException("Only the comment owner can edit this comment");
        }

        String oldContent = comment.getContent();
        comment.setContent(request.content().trim());

        Comment saved = commentRepository.save(comment);

        auditLogService.logAction(
            requesterUserId,
            "UPDATE",
            "COMMENT",
            saved.getId(),
            Map.of("content", oldContent),
            Map.of("content", saved.getContent())
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteComment(UUID ticketId, UUID commentId, UUID requesterUserId, String requesterRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new TicketNotFoundException("Comment not found for id: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to the specified ticket");
        }

        boolean isOwner = requesterUserId.equals(comment.getUser().getId());
        boolean isAdmin = isAdminRole(requesterRole);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Only the comment owner or an admin can delete this comment");
        }

        auditLogService.logAction(
                requesterUserId,
                "DELETE",
                "COMMENT",
                comment.getId(),
                Map.of("content", comment.getContent()),
                Map.of("deleted", true)
        );

        commentRepository.delete(comment);
    }

    private void enforceCommentAccess(Ticket ticket, UUID requesterUserId, String requesterRole) {
        if (isAdminRole(requesterRole)) {
            return;
        }

        if (isTechnicianRole(requesterRole)) {
            if (ticket.getAssignedTo() == null || !requesterUserId.equals(ticket.getAssignedTo().getId())) {
                throw new ForbiddenException("Technicians can comment only on their assigned tickets");
            }
            return;
        }

        if (!requesterUserId.equals(ticket.getUser().getId())) {
            throw new ForbiddenException("Students can comment only on their own tickets");
        }
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getTicket().getId(),
                comment.getUser().getId(),
                comment.getUser().getName(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    private boolean isAdminRole(String role) {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private boolean isTechnicianRole(String role) {
        return "TECHNICIAN".equalsIgnoreCase(role) || "ROLE_TECHNICIAN".equalsIgnoreCase(role);
    }
}
