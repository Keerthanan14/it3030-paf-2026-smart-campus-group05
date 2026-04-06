import { useEffect, useState } from "react";
import { useToast } from "../../../shared/components/ui/useToast";
import { useAuthStore } from "../../../core/store/authStore";
import useTicketActions from "./useTicketActions";
import useTicketAuditLogs from "./useTicketAuditLogs";
import useTicketAutoRefresh from "./useTicketAutoRefresh";
import useTicketComments from "./useTicketComments";
import useTicketDetail from "./useTicketDetail";
import useTicketsList from "./useTicketsList";
import { getApiErrorMessage } from "../utils/ticketUi";
import type { TicketPriority, TicketStatus } from "../../../types/ticket";

export type AdminTicketsPageLogic = {
  meta: {
    currentUserId?: string;
  };
  list: {
    tickets: ReturnType<typeof useTicketsList>["tickets"];
    loading: ReturnType<typeof useTicketsList>["loading"];
    error: ReturnType<typeof useTicketsList>["error"];
    status: TicketStatus | undefined;
    priority: TicketPriority | undefined;
    assignedToFilter: string;
    page: ReturnType<typeof useTicketsList>["page"];
    size: ReturnType<typeof useTicketsList>["size"];
    totalPages: ReturnType<typeof useTicketsList>["totalPages"];
    totalElements: ReturnType<typeof useTicketsList>["totalElements"];
    setPage: ReturnType<typeof useTicketsList>["setPage"];
    setSize: ReturnType<typeof useTicketsList>["setSize"];
    setAssignedToFilter: (value: string) => void;
    setStatus: (status: TicketStatus | undefined) => void;
    setPriority: (priority: TicketPriority | undefined) => void;
    applyAssignedFilter: () => void;
    refresh: ReturnType<typeof useTicketsList>["refresh"];
  };
  detail: {
    ticket: ReturnType<typeof useTicketDetail>["ticket"];
    loading: ReturnType<typeof useTicketDetail>["loading"];
    error: ReturnType<typeof useTicketDetail>["error"];
    setSelectedTicketId: ReturnType<typeof useTicketDetail>["setSelectedTicketId"];
    technicianId: string;
    setTechnicianId: (value: string) => void;
    canAssign: boolean;
    canUpdateStatus: boolean;
    canAddComment: boolean;
  };
  comments: {
    items: ReturnType<typeof useTicketComments>["comments"];
    loading: ReturnType<typeof useTicketComments>["loading"];
    error: ReturnType<typeof useTicketComments>["error"];
    draft: string;
    setDraft: (value: string) => void;
    editingCommentId: string | null;
    editingCommentValue: string;
    setEditingCommentValue: (value: string) => void;
    startEditComment: (commentId: string, content: string) => void;
    cancelEditComment: () => void;
  };
  actions: {
    loading: ReturnType<typeof useTicketActions>["loading"];
    error: ReturnType<typeof useTicketActions>["error"];
    handleStatusUpdate: (status: TicketStatus) => Promise<void>;
    handleAssign: () => Promise<void>;
    handleAddComment: () => Promise<void>;
    saveEditedComment: () => Promise<void>;
    removeComment: (commentId: string) => Promise<void>;
  };
  audit: {
    items: ReturnType<typeof useTicketAuditLogs>["items"];
    loading: ReturnType<typeof useTicketAuditLogs>["loading"];
    error: ReturnType<typeof useTicketAuditLogs>["error"];
    filters: ReturnType<typeof useTicketAuditLogs>["filters"];
    page: ReturnType<typeof useTicketAuditLogs>["page"];
    size: ReturnType<typeof useTicketAuditLogs>["size"];
    totalPages: ReturnType<typeof useTicketAuditLogs>["totalPages"];
    totalElements: ReturnType<typeof useTicketAuditLogs>["totalElements"];
    setPage: ReturnType<typeof useTicketAuditLogs>["setPage"];
    setSize: ReturnType<typeof useTicketAuditLogs>["setSize"];
    updateFilters: ReturnType<typeof useTicketAuditLogs>["updateFilters"];
    refresh: ReturnType<typeof useTicketAuditLogs>["refresh"];
  };
};

export function useAdminTicketsPageLogic(): AdminTicketsPageLogic {
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);

  const {
    tickets,
    loading,
    error,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setSize,
    updateFilters,
    refresh,
  } = useTicketsList();

  const { loading: actionLoading, error: actionError, updateStatus, assignTechnician } = useTicketActions();
  const { ticket, loading: detailLoading, error: detailError, setSelectedTicketId, refresh: refreshDetail } = useTicketDetail();

  const {
    items: auditItems,
    loading: auditLoading,
    error: auditError,
    filters: auditFilters,
    page: auditPage,
    size: auditSize,
    totalPages: auditTotalPages,
    totalElements: auditTotalElements,
    setPage: setAuditPage,
    setSize: setAuditSize,
    updateFilters: updateAuditFilters,
    refresh: refreshAudit,
  } = useTicketAuditLogs({ defaultEntityType: "TICKET" });

  const [assignedToFilter, setAssignedToFilter] = useState(filters.assignedTo ?? "");
  const [technicianId, setTechnicianId] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");

  const {
    comments,
    loading: commentLoading,
    error: commentError,
    addComment,
    updateComment,
    deleteComment,
    setCommentList,
  } = useTicketComments(ticket?.comments ?? []);

  useEffect(() => {
    setCommentList(ticket?.comments ?? []);
  }, [setCommentList, ticket]);

  useTicketAutoRefresh({
    enabled: Boolean(ticket?.id),
    onRefresh: async () => {
      await Promise.all([refresh(), refreshDetail()]);
    },
  });

  const handleStatusUpdate = async (nextStatus: TicketStatus): Promise<void> => {
    if (!ticket) return;

    try {
      await updateStatus(ticket.id, { status: nextStatus });
      toast.success("Status updated", `Ticket is now ${nextStatus}.`);
      await Promise.all([refresh(), refreshDetail()]);
    } catch (error) {
      toast.error("Status update failed", getApiErrorMessage(error, "Try again."));
    }
  };

  const handleAssign = async (): Promise<void> => {
    if (!ticket || !technicianId.trim()) return;

    try {
      await assignTechnician(ticket.id, { technicianId: technicianId.trim() });
      setTechnicianId("");
      toast.success("Technician assigned");
      await Promise.all([refresh(), refreshDetail()]);
    } catch (error) {
      toast.error("Assignment failed", getApiErrorMessage(error, "Check technician ID."));
    }
  };

  const handleAddComment = async (): Promise<void> => {
    if (!ticket || !commentDraft.trim()) return;

    try {
      await addComment(ticket.id, commentDraft.trim());
      setCommentDraft("");
      toast.success("Comment added");
      await refreshDetail();
    } catch (error) {
      toast.error("Could not add comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const startEditComment = (commentId: string, content: string): void => {
    setEditingCommentId(commentId);
    setEditingCommentValue(content);
  };

  const cancelEditComment = (): void => {
    setEditingCommentId(null);
    setEditingCommentValue("");
  };

  const saveEditedComment = async (): Promise<void> => {
    if (!ticket || !editingCommentId || !editingCommentValue.trim()) return;

    try {
      await updateComment(ticket.id, editingCommentId, editingCommentValue.trim());
      toast.success("Comment updated");
      cancelEditComment();
      await refreshDetail();
    } catch (error) {
      toast.error("Could not update comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const removeComment = async (commentId: string): Promise<void> => {
    if (!ticket) return;
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    try {
      await deleteComment(ticket.id, commentId);
      toast.success("Comment deleted");
      await refreshDetail();
    } catch (error) {
      toast.error("Could not delete comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const canAssign = Boolean(ticket?.links?.assign);
  const canUpdateStatus = Boolean(ticket?.links?.updateStatus);
  const canAddComment = Boolean(ticket?.links?.addComment);

  return {
    meta: {
      currentUserId: currentUser?.id,
    },
    list: {
      tickets,
      loading,
      error,
      status: filters.status as TicketStatus | undefined,
      priority: filters.priority as TicketPriority | undefined,
      assignedToFilter,
      page,
      size,
      totalPages,
      totalElements,
      setPage,
      setSize,
      setAssignedToFilter,
      setStatus: (status) => updateFilters({ status }),
      setPriority: (priority) => updateFilters({ priority }),
      applyAssignedFilter: () => updateFilters({ assignedTo: assignedToFilter.trim() || undefined }),
      refresh,
    },
    detail: {
      ticket,
      loading: detailLoading,
      error: detailError,
      setSelectedTicketId,
      technicianId,
      setTechnicianId,
      canAssign,
      canUpdateStatus,
      canAddComment,
    },
    comments: {
      items: comments,
      loading: commentLoading,
      error: commentError,
      draft: commentDraft,
      setDraft: setCommentDraft,
      editingCommentId,
      editingCommentValue,
      setEditingCommentValue,
      startEditComment,
      cancelEditComment,
    },
    actions: {
      loading: actionLoading,
      error: actionError,
      handleStatusUpdate,
      handleAssign,
      handleAddComment,
      saveEditedComment,
      removeComment,
    },
    audit: {
      items: auditItems,
      loading: auditLoading,
      error: auditError,
      filters: auditFilters,
      page: auditPage,
      size: auditSize,
      totalPages: auditTotalPages,
      totalElements: auditTotalElements,
      setPage: setAuditPage,
      setSize: setAuditSize,
      updateFilters: updateAuditFilters,
      refresh: refreshAudit,
    },
  };
}

export default useAdminTicketsPageLogic;
