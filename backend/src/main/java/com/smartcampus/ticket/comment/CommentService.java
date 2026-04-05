package com.smartcampus.ticket.comment;

import com.smartcampus.ticket.dto.CommentResponse;
import com.smartcampus.ticket.dto.CreateCommentRequest;
import com.smartcampus.ticket.dto.UpdateCommentRequest;

import java.util.UUID;

public interface CommentService {

    CommentResponse createComment(UUID ticketId, CreateCommentRequest request, UUID requesterUserId, String requesterRole);

    CommentResponse updateComment(UUID ticketId,
                                  UUID commentId,
                                  UpdateCommentRequest request,
                                  UUID requesterUserId);

    void deleteComment(UUID ticketId, UUID commentId, UUID requesterUserId, String requesterRole);
}
