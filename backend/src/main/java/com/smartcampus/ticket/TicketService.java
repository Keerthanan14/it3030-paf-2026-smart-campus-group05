package com.smartcampus.ticket;

import com.smartcampus.ticket.dto.AssignTicketRequest;
import com.smartcampus.ticket.dto.CreateTicketRequest;
import com.smartcampus.ticket.dto.PaginatedTicketResponse;
import com.smartcampus.ticket.dto.TicketResponse;
import com.smartcampus.ticket.dto.UpdateTicketStatusRequest;

import java.util.UUID;

public interface TicketService {

    PaginatedTicketResponse getTickets(UUID requesterUserId,
                                       String requesterRole,
                                       TicketStatus status,
                                       TicketPriority priority,
                                       String category,
                                       UUID assignedTo,
                                       int page,
                                       int size);

    TicketResponse getTicketById(UUID ticketId, UUID requesterUserId, String requesterRole);

    TicketResponse createTicket(CreateTicketRequest request, UUID requesterUserId, String requesterRole);

    TicketResponse updateTicketStatus(UUID ticketId,
                                      UpdateTicketStatusRequest request,
                                      UUID requesterUserId,
                                      String requesterRole);

    TicketResponse assignTicket(UUID ticketId, AssignTicketRequest request);
}
