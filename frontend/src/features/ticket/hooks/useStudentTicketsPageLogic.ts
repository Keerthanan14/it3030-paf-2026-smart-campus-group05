import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../shared/components/ui/ToastProvider";
import { useAuthStore } from "../../../core/store/authStore";
import useTicketActions from "./useTicketActions";
import useTicketAutoRefresh from "./useTicketAutoRefresh";
import useTicketComments from "./useTicketComments";
import useTicketDetail from "./useTicketDetail";
import useTicketsList from "./useTicketsList";
import { getApiErrorMessage, validateTicketImages } from "../utils/ticketUi";
import type { TicketPriority } from "../../../types/ticket";

export type StudentTicketsPageLogic = {
  meta: {
    currentUserId?: string;
  };
  create: {
    category: string;
    description: string;
    priority: TicketPriority;
    preferredContact: string;
    images: File[];
    imageError: string | null;
    canSubmit: boolean;
    actionLoading: boolean;
    actionError: string | null;
    setCategory: (value: string) => void;
    setDescription: (value: string) => void;
    setPriority: (value: TicketPriority) => void;
    setPreferredContact: (value: string) => void;
    handleFileSelection: (files: FileList | null) => void;
    handleCreateTicket: () => Promise<void>;
  };
  list: {
    tickets: ReturnType<typeof useTicketsList>["tickets"];
    loading: ReturnType<typeof useTicketsList>["loading"];
    error: ReturnType<typeof useTicketsList>["error"];
    filters: ReturnType<typeof useTicketsList>["filters"];
    page: ReturnType<typeof useTicketsList>["page"];
    size: ReturnType<typeof useTicketsList>["size"];
    totalPages: ReturnType<typeof useTicketsList>["totalPages"];
    totalElements: ReturnType<typeof useTicketsList>["totalElements"];
    setPage: ReturnType<typeof useTicketsList>["setPage"];
    setSize: ReturnType<typeof useTicketsList>["setSize"];
    updateFilters: ReturnType<typeof useTicketsList>["updateFilters"];
    refresh: ReturnType<typeof useTicketsList>["refresh"];
  };
  detail: {
    ticket: ReturnType<typeof useTicketDetail>["ticket"];
    loading: ReturnType<typeof useTicketDetail>["loading"];
    error: ReturnType<typeof useTicketDetail>["error"];
    setSelectedTicketId: ReturnType<typeof useTicketDetail>["setSelectedTicketId"];
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
    handleAddComment: () => Promise<void>;
    saveEditedComment: () => Promise<void>;
    removeComment: (commentId: string) => Promise<void>;
  };
};

export function useStudentTicketsPageLogic(): StudentTicketsPageLogic {
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

  const { loading: actionLoading, error: actionError, createTicket, createTicketWithImages } = useTicketActions();
  const { ticket, loading: detailLoading, error: detailError, setSelectedTicketId, refresh: refreshDetail } = useTicketDetail();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [preferredContact, setPreferredContact] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
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

  const canSubmit = useMemo(
    () => category.trim().length > 1 && description.trim().length > 5,
    [category, description]
  );

  const handleCreateTicket = async (): Promise<void> => {
    if (!canSubmit) return;

    const payload = {
      category: category.trim(),
      description: description.trim(),
      priority,
      preferredContact: preferredContact.trim() || undefined,
    };

    try {
      if (images.length > 0) {
        await createTicketWithImages(payload, images);
      } else {
        await createTicket(payload);
      }

      toast.success("Ticket created", "Your support request has been submitted.");
    } catch (error) {
      toast.error("Ticket creation failed", getApiErrorMessage(error, "Please check your inputs and try again."));
      return;
    }

    setCategory("");
    setDescription("");
    setPriority("MEDIUM");
    setPreferredContact("");
    setImages([]);
    await refresh();
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

  const handleFileSelection = (fileList: FileList | null): void => {
    const selected = Array.from(fileList ?? []);
    const validationError = validateTicketImages(selected);

    if (validationError) {
      setImageError(validationError);
      toast.warning("Attachment validation", validationError);
      return;
    }

    setImageError(null);
    setImages(selected);
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

  const canAddComment = Boolean(ticket?.links?.addComment);

  return {
    meta: {
      currentUserId: currentUser?.id,
    },
    create: {
      category,
      description,
      priority,
      preferredContact,
      images,
      imageError,
      canSubmit,
      actionLoading,
      actionError,
      setCategory,
      setDescription,
      setPriority,
      setPreferredContact,
      handleFileSelection,
      handleCreateTicket,
    },
    list: {
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
    },
    detail: {
      ticket,
      loading: detailLoading,
      error: detailError,
      setSelectedTicketId,
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
      handleAddComment,
      saveEditedComment,
      removeComment,
    },
  };
}

export default useStudentTicketsPageLogic;
