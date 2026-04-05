package com.smartcampus.ticket;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID>, JpaSpecificationExecutor<Ticket> {

    Optional<Ticket> findByIdAndUser_Id(UUID id, UUID userId);

    Optional<Ticket> findByIdAndAssignedTo_Id(UUID id, UUID assignedToId);

    Page<Ticket> findByUser_Id(UUID userId, Pageable pageable);

    Page<Ticket> findByAssignedTo_Id(UUID assignedToId, Pageable pageable);
}
