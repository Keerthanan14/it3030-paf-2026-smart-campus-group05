import { useState } from "react";
import ticketApi from "../../../core/api/ticketApi";
import type { TicketComment } from "../../../types/ticket";

export function useTicketComments(initialComments: TicketComment[] = []) {
  const [comments, setComments] = useState<TicketComment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = async (ticketId: string, content: string): Promise<TicketComment> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await ticketApi.addComment(ticketId, { content });
      setComments((previous) => [...previous, data]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add comment";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComment = async (ticketId: string, commentId: string, content: string): Promise<TicketComment> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await ticketApi.updateComment(ticketId, commentId, { content });
      setComments((previous) => previous.map((comment) => (comment.id === data.id ? data : comment)));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update comment";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (ticketId: string, commentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await ticketApi.deleteComment(ticketId, commentId);
      setComments((previous) => previous.filter((comment) => comment.id !== commentId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete comment";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setCommentList = (nextComments: TicketComment[]): void => {
    setComments(nextComments);
  };

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    setCommentList,
  };
}

export default useTicketComments;
