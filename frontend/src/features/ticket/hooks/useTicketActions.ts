import { useState } from "react";
import ticketApi from "../../../core/api/ticketApi";
import type {
  AssignTicketRequest,
  CreateTicketRequest,
  Ticket,
  UpdateTicketStatusRequest,
} from "../../../types/ticket";

export function useTicketActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T,>(action: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      return await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ticket action failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTicket = (request: CreateTicketRequest): Promise<Ticket> =>
    run(async () => {
      const { data } = await ticketApi.createTicket(request);
      return data;
    });

  const createTicketWithImages = (request: CreateTicketRequest, images: File[]): Promise<Ticket> =>
    run(async () => {
      const { data } = await ticketApi.createTicketWithImages(request, images);
      return data;
    });

  const updateStatus = (ticketId: string, payload: UpdateTicketStatusRequest): Promise<Ticket> =>
    run(async () => {
      const { data } = await ticketApi.updateTicketStatus(ticketId, payload);
      return data;
    });

  const assignTechnician = (ticketId: string, payload: AssignTicketRequest): Promise<Ticket> =>
    run(async () => {
      const { data } = await ticketApi.assignTechnician(ticketId, payload);
      return data;
    });

  return {
    loading,
    error,
    createTicket,
    createTicketWithImages,
    updateStatus,
    assignTechnician,
  };
}

export default useTicketActions;
