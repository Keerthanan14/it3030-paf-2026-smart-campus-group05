import { useEffect, useMemo, useState } from "react";
import { userApi } from "../../../core/api/userApi";
import { useToast } from "../../../shared/components/ui/useToast";
import { useAuthStore } from "../../../core/store/authStore";
import useTicketActions from "./useTicketActions";
import useTicketAutoRefresh from "./useTicketAutoRefresh";
import useTicketComments from "./useTicketComments";
import useTicketDetail from "./useTicketDetail";
import useTicketsList from "./useTicketsList";
import { getApiErrorMessage } from "../utils/ticketUi";
import type { TicketPriority, TicketStatus } from "../../../types/ticket";
import type { UserListItem } from "../../../types/user";

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
    refresh: ReturnType<typeof useTicketsList>["refresh"];
  };
  detail: {
    ticket: ReturnType<typeof useTicketDetail>["ticket"];
    loading: ReturnType<typeof useTicketDetail>["loading"];
    error: ReturnType<typeof useTicketDetail>["error"];
    setSelectedTicketId: ReturnType<typeof useTicketDetail>["setSelectedTicketId"];
    technicianId: string;
    setTechnicianId: (value: string) => void;
    technicians: UserListItem[];
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
    handleAssignForTicket: (ticketId: string, technicianInput: string) => Promise<void>;
    handleRejectForTicket: (ticketId: string) => Promise<void>;
    handleAddComment: () => Promise<void>;
    saveEditedComment: () => Promise<void>;
    removeComment: (commentId: string) => Promise<void>;
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
  const [technicians, setTechnicians] = useState<UserListItem[]>([]);

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

  useEffect(() => {
    let isMounted = true;

    const loadTechnicians = async (): Promise<void> => {
      try {
        const { data } = await userApi.getAll();
        if (!isMounted) return;

        const technicianUsers = data.filter((user) => user.role === "TECHNICIAN" || user.role === "ROLE_TECHNICIAN");
        setTechnicians(technicianUsers);
      } catch {
        if (isMounted) {
          setTechnicians([]);
        }
      }
    };

    void loadTechnicians();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const resolveTechnicianId = (technicianInput: string): string | null => {
    const normalizedInput = technicianInput.trim().toLowerCase();
    if (!normalizedInput) return null;

    const matchedTechnician = technicians.find((technician) => {
      return (
        technician.id.toLowerCase() === normalizedInput ||
        technician.name.toLowerCase() === normalizedInput ||
        technician.email.toLowerCase() === normalizedInput ||
        `${technician.name} (${technician.email})`.toLowerCase() === normalizedInput
      );
    });

    return matchedTechnician?.id ?? null;
  };

  const handleAssignForTicket = async (ticketId: string, technicianInput: string): Promise<void> => {
    const resolvedTechnicianId = resolveTechnicianId(technicianInput);
    if (!ticketId || !resolvedTechnicianId) {
      toast.error("Assignment failed", "Select a valid technician from the dropdown.");
      return;
    }

    try {
      await assignTechnician(ticketId, { technicianId: resolvedTechnicianId });
      toast.success("Technician assigned");
      await refresh();
      if (ticket?.id === ticketId) {
        await refreshDetail();
      }
    } catch (error) {
      toast.error("Assignment failed", getApiErrorMessage(error, "Check technician selection."));
    }
  };

  const handleRejectForTicket = async (ticketId: string): Promise<void> => {
    if (!ticketId) return;

    try {
      await updateStatus(ticketId, { status: "REJECTED" });
      toast.success("Status updated", "Ticket is now REJECTED.");
      await refresh();
      if (ticket?.id === ticketId) {
        await refreshDetail();
      }
    } catch (error) {
      toast.error("Status update failed", getApiErrorMessage(error, "Try again."));
    }
  };

  const handleAddComment = async (): Promise<void> => {
    if (!ticket || !commentDraft.trim()) return;

    try {
      await addComment(ticket.id, commentDraft.trim());
      setCommentDraft("");
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

    try {
      await deleteComment(ticket.id, commentId);
      await refreshDetail();
    } catch (error) {
      toast.error("Could not delete comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const canAssign = Boolean(ticket?.links?.assign);
  const canUpdateStatus = Boolean(ticket?.links?.updateStatus);
  const canAddComment = Boolean(ticket?.links?.addComment);

  const assignedToSearchTerm = assignedToFilter.trim().toLowerCase();

  const visibleTickets = useMemo(() => {
    if (!assignedToSearchTerm) return tickets;

    return tickets.filter((ticketItem) => {
      const assignedName = (ticketItem.assignedToName ?? "").toLowerCase();
      const assignedId = (ticketItem.assignedToId ?? "").toLowerCase();
      const technicianEmail = technicians.find((technician) => technician.id === ticketItem.assignedToId)?.email.toLowerCase() ?? "";

      return (
        assignedName.includes(assignedToSearchTerm) ||
        technicianEmail.includes(assignedToSearchTerm) ||
        assignedId.includes(assignedToSearchTerm)
      );
    });
  }, [tickets, technicians, assignedToSearchTerm]);

  return {
    meta: {
      currentUserId: currentUser?.id,
    },
    list: {
      tickets: visibleTickets,
      loading,
      error,
      status: filters.status as TicketStatus | undefined,
      priority: filters.priority as TicketPriority | undefined,
      assignedToFilter,
      page,
      size,
      totalPages,
      totalElements: assignedToSearchTerm ? visibleTickets.length : totalElements,
      setPage,
      setSize,
      setAssignedToFilter,
      setStatus: (status) => updateFilters({ status }),
      setPriority: (priority) => updateFilters({ priority }),
      refresh,
    },
    detail: {
      ticket,
      loading: detailLoading,
      error: detailError,
      setSelectedTicketId,
      technicianId,
      setTechnicianId,
      technicians,
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
      handleAssignForTicket,
      handleRejectForTicket,
      handleAddComment,
      saveEditedComment,
      removeComment,
    },
  };
}

export default useAdminTicketsPageLogic;
