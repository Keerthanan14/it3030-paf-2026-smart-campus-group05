package com.smartcampus.ticket.comment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findByTicket_IdOrderByCreatedAtAsc(UUID ticketId);

    Optional<Comment> findByIdAndUser_Id(UUID id, UUID userId);
}
