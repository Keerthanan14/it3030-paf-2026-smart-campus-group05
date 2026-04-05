package com.smartcampus.ticket.comment;

import com.smartcampus.security.AuthUserPrincipal;
import com.smartcampus.ticket.dto.CommentResponse;
import com.smartcampus.ticket.dto.CreateCommentRequest;
import com.smartcampus.ticket.dto.UpdateCommentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        CommentResponse response = commentService.createComment(ticketId, request, principal.userId(), principal.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        return ResponseEntity.ok(commentService.updateComment(ticketId, commentId, request, principal.userId()));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal AuthUserPrincipal principal) {
        commentService.deleteComment(ticketId, commentId, principal.userId(), principal.role());
        return ResponseEntity.noContent().build();
    }
}
