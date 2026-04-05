package com.smartcampus.ticket;

import com.smartcampus.security.AuthUserPrincipal;
import com.smartcampus.ticket.dto.AssignTicketRequest;
import com.smartcampus.ticket.dto.CreateTicketRequest;
import com.smartcampus.ticket.dto.PaginatedTicketResponse;
import com.smartcampus.ticket.dto.TicketResponse;
import com.smartcampus.ticket.dto.UpdateTicketStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<PaginatedTicketResponse> getTickets(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) UUID assignedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PaginatedTicketResponse response = ticketService.getTickets(
                principal.userId(),
                principal.role(),
                status,
                priority,
                category,
                assignedTo,
                page,
                size
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        return ResponseEntity.ok(ticketService.getTicketById(id, principal.userId(), principal.role()));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TicketResponse> createTicketJson(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        TicketResponse response = ticketService.createTicket(request, null, principal.userId(), principal.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<TicketResponse> createTicketMultipart(
            @Valid @RequestPart("request") CreateTicketRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        TicketResponse response = ticketService.createTicket(request, images, principal.userId(), principal.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, request, principal.userId(), principal.role()));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assignTicket(id, request));
    }
}
