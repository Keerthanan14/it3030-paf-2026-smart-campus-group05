import { Button } from "../../../shared/components/ui/Button";
import type { Ticket, TicketComment } from "../../../types/ticket";
import BaseTicketDetail from "./BaseTicketDetail";

type StudentTicketDetailProps = {
  ticket: Ticket | null;
  detailLoading: boolean;
  detailError: string | null;
  commentError: string | null;
  commentLoading: boolean;
  canAddComment: boolean;
  comments: TicketComment[];
  commentDraft: string;
  editingCommentId: string | null;
  editingCommentValue: string;
  currentUserId?: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelEditComment: () => void;
  onEditingCommentValueChange: (value: string) => void;
  onSaveEditedComment: () => void;
  onRemoveComment: (commentId: string) => void;
};

export function StudentTicketDetail({
  ticket,
  detailLoading,
  detailError,
  commentError,
  commentLoading,
  canAddComment,
  comments,
  commentDraft,
  editingCommentId,
  editingCommentValue,
  currentUserId,
  onCommentDraftChange,
  onAddComment,
  onStartEditComment,
  onCancelEditComment,
  onEditingCommentValueChange,
  onSaveEditedComment,
  onRemoveComment,
}: StudentTicketDetailProps) {
  const metaFields = [
    { label: "Category", value: ticket?.category ?? "-" },
    { label: "Status", value: ticket?.status ?? "-" },
    { label: "Priority", value: ticket?.priority ?? "-" },
    { label: "Assigned", value: ticket?.assignedToName ?? "Not assigned" },
  ];

  return (
    <BaseTicketDetail
      title="Ticket Detail"
      emptyMessage="Select a ticket to view full details."
      ticket={ticket}
      detailLoading={detailLoading}
      detailError={detailError}
      commentError={commentError}
      commentLoading={commentLoading}
      canAddComment={canAddComment}
      cannotCommentMessage="You do not have permission to add comments for this ticket state."
      commentInputPlaceholder="Add a comment"
      comments={comments}
      commentDraft={commentDraft}
      editingCommentId={editingCommentId}
      editingCommentValue={editingCommentValue}
      metaFields={metaFields}
      onCommentDraftChange={onCommentDraftChange}
      onAddComment={onAddComment}
      onCancelEditComment={onCancelEditComment}
      onEditingCommentValueChange={onEditingCommentValueChange}
      onSaveEditedComment={onSaveEditedComment}
      renderCommentActions={(comment) => {
        if (currentUserId !== comment.userId) return null;

        return (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => onStartEditComment(comment.id, comment.content)}>
              Edit
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => onRemoveComment(comment.id)}>
              Delete
            </Button>
          </>
        );
      }}
    />
  );
}

export default StudentTicketDetail;
