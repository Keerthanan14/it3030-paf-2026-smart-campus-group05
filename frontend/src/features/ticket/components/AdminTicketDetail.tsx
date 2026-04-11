import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";
import type { Ticket, TicketComment, TicketStatus } from "../../../types/ticket";
import type { UserListItem } from "../../../types/user";
import BaseTicketDetail from "./BaseTicketDetail";

type AdminTicketDetailProps = {
  ticket: Ticket | null;
  detailLoading: boolean;
  detailError: string | null;
  actionError: string | null;
  commentError: string | null;
  actionLoading: boolean;
  commentLoading: boolean;
  canAssign: boolean;
  canUpdateStatus: boolean;
  canAddComment: boolean;
  technicianId: string;
  technicians: UserListItem[];
  comments: TicketComment[];
  commentDraft: string;
  editingCommentId: string | null;
  editingCommentValue: string;
  currentUserId?: string;
  onTechnicianIdChange: (value: string) => void;
  onAssign: () => void;
  onStatusUpdate: (status: TicketStatus) => void;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelEditComment: () => void;
  onEditingCommentValueChange: (value: string) => void;
  onSaveEditedComment: () => void;
  onRemoveComment: (commentId: string) => void;
};

export function AdminTicketDetail({
  ticket,
  detailLoading,
  detailError,
  actionError,
  commentError,
  actionLoading,
  commentLoading,
  canAssign,
  canUpdateStatus,
  canAddComment,
  technicianId,
  technicians,
  comments,
  commentDraft,
  editingCommentId,
  editingCommentValue,
  currentUserId,
  onTechnicianIdChange,
  onAssign,
  onStatusUpdate,
  onCommentDraftChange,
  onAddComment,
  onStartEditComment,
  onCancelEditComment,
  onEditingCommentValueChange,
  onSaveEditedComment,
  onRemoveComment,
}: AdminTicketDetailProps) {
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<string | null>(null);
  const [technicianSearch, setTechnicianSearch] = useState("");
  const [isTechnicianMenuOpen, setIsTechnicianMenuOpen] = useState(false);
  const technicianPickerRef = useRef<HTMLDivElement | null>(null);

  const metaFields = [
    { label: "Category", value: ticket?.category ?? "-" },
    { label: "Requester", value: ticket?.userName ?? "-" },
    { label: "Priority", value: ticket?.priority ?? "-" },
    { label: "Assigned", value: ticket?.assignedToName ?? "Unassigned" },
  ];

  const confirmDeleteComment = (): void => {
    if (!deleteTargetCommentId) return;
    onRemoveComment(deleteTargetCommentId);
    setDeleteTargetCommentId(null);
  };

  const selectedTechnician = useMemo(
    () => technicians.find((technician) => technician.id === technicianId) ?? null,
    [technicians, technicianId]
  );

  const filteredTechnicians = useMemo(() => {
    const term = technicianSearch.trim().toLowerCase();
    if (!term) return technicians;

    return technicians.filter((technician) => {
      const name = technician.name.toLowerCase();
      const email = technician.email.toLowerCase();
      const id = technician.id.toLowerCase();
      return name.includes(term) || email.includes(term) || id.includes(term);
    });
  }, [technicians, technicianSearch]);

  const showAssignmentActions = !ticket?.assignedToId;

  const selectTechnician = (technician: UserListItem): void => {
    onTechnicianIdChange(technician.id);
    setTechnicianSearch(`${technician.name} · ${technician.email}`);
    setIsTechnicianMenuOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (!technicianPickerRef.current) return;
      if (!technicianPickerRef.current.contains(event.target as Node)) {
        setIsTechnicianMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const contentActions = showAssignmentActions ? (
    <>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <div ref={technicianPickerRef} className="relative">
          <label className="mb-1 block text-sm font-medium">Assign Technician</label>
          <div className="flex items-stretch">
            <input
              type="text"
              value={technicianSearch}
              onFocus={() => setIsTechnicianMenuOpen(true)}
              onChange={(e) => {
                const value = e.target.value;
                setTechnicianSearch(value);
                setIsTechnicianMenuOpen(true);

                const selectedLabel = selectedTechnician ? `${selectedTechnician.name} · ${selectedTechnician.email}` : "";
                if (technicianId && value !== selectedLabel) {
                  onTechnicianIdChange("");
                }
              }}
              placeholder="Search and select a technician"
              className="h-10 w-full rounded-l-md rounded-r-none border border-border bg-background px-3 text-xs text-foreground ring-1 ring-inset ring-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              type="button"
              onClick={onAssign}
              isLoading={actionLoading}
              disabled={!technicianId.trim() || !canAssign}
              className="h-10 rounded-l-none border-l-0"
            >
              Assign
            </Button>
          </div>

          {isTechnicianMenuOpen ? (
            <div className="absolute z-20 mt-2 w-full rounded-md border border-border/70 bg-background p-2 shadow-lg">
              <div className="max-h-56 overflow-y-auto">
                {filteredTechnicians.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTechnicians.map((technician) => (
                      <button
                        key={technician.id}
                        type="button"
                        className={`w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted ${technicianId === technician.id ? "bg-muted" : ""}`}
                        onClick={() => selectTechnician(technician)}
                      >
                        <div className="font-medium">{technician.name}</div>
                        <div className="text-xs text-foreground/60">{technician.email}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-foreground/60">No technicians found.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="danger"
            onClick={() => onStatusUpdate("REJECTED")}
            isLoading={actionLoading}
            disabled={!canUpdateStatus}
            className="min-w-24 whitespace-nowrap"
          >
            Reject
          </Button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <BaseTicketDetail
      title="Ticket Detail & Actions"
      emptyMessage="Select a ticket to manage assignment and status."
      ticket={ticket}
      showChat={false}
      contentActionsPosition="before"
      detailLoading={detailLoading}
      detailError={detailError}
      actionError={actionError}
      commentError={commentError}
      commentLoading={commentLoading}
      canAddComment={canAddComment}
      cannotCommentMessage="Comment actions are not available for this ticket."
      commentInputPlaceholder="Add admin note"
      comments={comments}
      commentDraft={commentDraft}
      editingCommentId={editingCommentId}
      editingCommentValue={editingCommentValue}
      metaFields={metaFields}
      contentActions={contentActions}
      currentUserId={currentUserId}
      onCommentDraftChange={onCommentDraftChange}
      onAddComment={onAddComment}
      onCancelEditComment={onCancelEditComment}
      onEditingCommentValueChange={onEditingCommentValueChange}
      onSaveEditedComment={onSaveEditedComment}
      renderCommentActions={(comment) => {
        if (deleteTargetCommentId === comment.id) {
          return (
            <div className="flex items-center gap-1 rounded-md border border-border/70 bg-background/95 px-2 py-1 text-xs">
              <span>Delete?</span>
              <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setDeleteTargetCommentId(null)}>
                No
              </Button>
              <Button type="button" size="sm" variant="danger" className="h-6 px-2 text-xs" onClick={confirmDeleteComment}>
                Yes
              </Button>
            </div>
          );
        }

        return (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 border-0 p-0 shadow-none"
              onClick={() => onStartEditComment(comment.id, comment.content)}
              disabled={currentUserId !== comment.userId}
              aria-label="Edit comment"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 border-0 p-0 text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTargetCommentId(comment.id)}
              disabled={!canAddComment}
              aria-label="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        );
      }}
    />
  );
}

export default AdminTicketDetail;
