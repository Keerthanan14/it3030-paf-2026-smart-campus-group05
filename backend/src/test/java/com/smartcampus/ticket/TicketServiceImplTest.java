package com.smartcampus.ticket;

import com.smartcampus.audit.AuditLogService;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.resource.ResourceRepository;
import com.smartcampus.ticket.attachment.FileStorageService;
import com.smartcampus.ticket.attachment.TicketAttachmentRepository;
import com.smartcampus.ticket.comment.CommentRepository;
import com.smartcampus.ticket.dto.PaginatedTicketResponse;
import com.smartcampus.ticket.dto.UpdateTicketStatusRequest;
import com.smartcampus.user.Role;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ResourceRepository resourceRepository;
    @Mock
    private TicketAttachmentRepository ticketAttachmentRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;

    private TicketServiceImpl ticketService;

    @BeforeEach
    void setUp() {
        ticketService = new TicketServiceImpl(
                ticketRepository,
                userRepository,
                resourceRepository,
                ticketAttachmentRepository,
                commentRepository,
                fileStorageService,
                auditLogService,
                notificationService
        );
    }

    @Test
    void updateTicketStatus_shouldSendNotificationToTicketOwner() {
        UUID ticketId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);
        owner.setName("Owner");

        Ticket ticket = new Ticket();
        ticket.setId(ticketId);
        ticket.setUser(owner);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setCategory("IT");
        ticket.setCreatedAt(LocalDateTime.now().minusHours(1));

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ticketAttachmentRepository.findByTicket_Id(ticketId)).thenReturn(List.of());
        when(commentRepository.findByTicket_IdOrderByCreatedAtAsc(ticketId)).thenReturn(List.of());

        ticketService.updateTicketStatus(
                ticketId,
                new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null),
                UUID.randomUUID(),
                "ADMIN"
        );

        verify(notificationService).sendTicketStatusNotification(ownerId, ticketId, "IN_PROGRESS");
    }

    @Test
    void getTickets_shouldFilterBySlaBreachedWhenRequested() {
        UUID adminId = UUID.randomUUID();

        User owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setName("Student");

        Ticket breached = new Ticket();
        breached.setId(UUID.randomUUID());
        breached.setUser(owner);
        breached.setStatus(TicketStatus.OPEN);
        breached.setPriority(TicketPriority.MEDIUM);
        breached.setCategory("Electrical");
        breached.setCreatedAt(LocalDateTime.now().minusHours(6));

        Ticket withinSla = new Ticket();
        withinSla.setId(UUID.randomUUID());
        withinSla.setUser(owner);
        withinSla.setStatus(TicketStatus.OPEN);
        withinSla.setPriority(TicketPriority.MEDIUM);
        withinSla.setCategory("Electrical");
        withinSla.setCreatedAt(LocalDateTime.now().minusHours(1));

        when(ticketRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(breached, withinSla));
        when(ticketAttachmentRepository.findByTicket_Id(any(UUID.class))).thenReturn(List.of());
        when(commentRepository.findByTicket_IdOrderByCreatedAtAsc(any(UUID.class))).thenReturn(List.of());

        PaginatedTicketResponse response = ticketService.getTickets(
                adminId,
                "ADMIN",
                null,
                null,
                null,
                null,
                true,
                0,
                10
        );

        assertEquals(1, response.content().size());
        assertEquals(breached.getId(), response.content().getFirst().id());
    }

    @Test
    void getTicketById_shouldReturnDynamicLinksForAdmin() {
        UUID ticketId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        User owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setName("Student");

        Ticket ticket = new Ticket();
        ticket.setId(ticketId);
        ticket.setUser(owner);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setCategory("Network");
        ticket.setCreatedAt(LocalDateTime.now().minusMinutes(30));

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(ticketAttachmentRepository.findByTicket_Id(ticketId)).thenReturn(List.of());
        when(commentRepository.findByTicket_IdOrderByCreatedAtAsc(ticketId)).thenReturn(List.of());

        var response = ticketService.getTicketById(ticketId, adminId, "ADMIN");

        assertTrue(response.links().containsKey("self"));
        assertTrue(response.links().containsKey("assign"));
        assertTrue(response.links().containsKey("updateStatus"));
        assertTrue(response.links().containsKey("addComment"));
    }
}
