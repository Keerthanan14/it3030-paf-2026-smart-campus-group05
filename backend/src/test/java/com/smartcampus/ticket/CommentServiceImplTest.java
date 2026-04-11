package com.smartcampus.ticket;

import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.ticket.comment.Comment;
import com.smartcampus.ticket.comment.CommentRepository;
import com.smartcampus.ticket.comment.CommentServiceImpl;
import com.smartcampus.ticket.dto.CreateCommentRequest;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    private CommentServiceImpl commentService;

    @BeforeEach
    void setUp() {
        commentService = new CommentServiceImpl(
                commentRepository,
                ticketRepository,
                userRepository,
                notificationService
        );
    }

    @Test
    void createComment_shouldNotifyOwnerWhenCommenterIsDifferentUser() {
        UUID ticketId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID techId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);
        owner.setName("Owner");

        User technician = new User();
        technician.setId(techId);
        technician.setName("Tech");

        Ticket ticket = new Ticket();
        ticket.setId(ticketId);
        ticket.setUser(owner);
        ticket.setAssignedTo(technician);

        Comment saved = new Comment();
        saved.setId(UUID.randomUUID());
        saved.setTicket(ticket);
        saved.setUser(technician);
        saved.setContent("Investigating now");

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(techId)).thenReturn(Optional.of(technician));
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);

        commentService.createComment(ticketId, new CreateCommentRequest("Investigating now"), techId, "TECHNICIAN");

        verify(notificationService).sendNewCommentNotification(ownerId, ticketId, "Tech");
    }

    @Test
    void createComment_shouldNotNotifyWhenOwnerCommentsOnOwnTicket() {
        UUID ticketId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);
        owner.setName("Owner");

        Ticket ticket = new Ticket();
        ticket.setId(ticketId);
        ticket.setUser(owner);

        Comment saved = new Comment();
        saved.setId(UUID.randomUUID());
        saved.setTicket(ticket);
        saved.setUser(owner);
        saved.setContent("Any update?");

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);

        commentService.createComment(ticketId, new CreateCommentRequest("Any update?"), ownerId, "STUDENT");

        verify(notificationService, never()).sendNewCommentNotification(any(), any(), any());
    }

    @Test
    void createComment_shouldRejectUnauthorizedStudent() {
        UUID ticketId = UUID.randomUUID();

        User owner = new User();
        owner.setId(UUID.randomUUID());

        Ticket ticket = new Ticket();
        ticket.setId(ticketId);
        ticket.setUser(owner);

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        assertThrows(
                ForbiddenException.class,
                () -> commentService.createComment(ticketId, new CreateCommentRequest("test"), UUID.randomUUID(), "STUDENT")
        );
    }
}
