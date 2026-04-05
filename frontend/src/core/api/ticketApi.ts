import api from "./client";
import type {
	AssignTicketRequest,
	CreateCommentRequest,
	CreateTicketRequest,
	PaginatedAuditLogResponse,
	PaginatedTicketsResponse,
	Ticket,
	TicketComment,
	TicketFilters,
	UpdateCommentRequest,
	UpdateTicketStatusRequest,
} from "../../types/ticket";

type ListTicketsParams = {
	page?: number;
	size?: number;
	filters?: TicketFilters;
};

type ListAuditLogsParams = {
	entityType?: string;
	action?: string;
	userId?: string;
	page?: number;
	size?: number;
};

const appendRequestPart = (formData: FormData, request: CreateTicketRequest): void => {
	const requestBlob = new Blob([JSON.stringify(request)], { type: "application/json" });
	formData.append("request", requestBlob);
};

const appendImagesPart = (formData: FormData, images: File[]): void => {
	images.forEach((image) => {
		formData.append("images", image);
	});
};

export const ticketApi = {
	listTickets({ page = 0, size = 10, filters = {} }: ListTicketsParams = {}) {
		return api.get<PaginatedTicketsResponse>("/tickets", {
			params: {
				page,
				size,
				status: filters.status,
				priority: filters.priority,
				category: filters.category || undefined,
				assignedTo: filters.assignedTo || undefined,
				slaBreached: filters.slaBreached,
			},
		});
	},

	getTicketById(id: string) {
		return api.get<Ticket>(`/tickets/${id}`);
	},

	createTicket(request: CreateTicketRequest) {
		return api.post<Ticket>("/tickets", request, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	},

	createTicketWithImages(request: CreateTicketRequest, images: File[]) {
		const formData = new FormData();
		appendRequestPart(formData, request);
		appendImagesPart(formData, images);

		return api.post<Ticket>("/tickets", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	updateTicketStatus(id: string, payload: UpdateTicketStatusRequest) {
		return api.put<Ticket>(`/tickets/${id}/status`, payload);
	},

	assignTechnician(id: string, payload: AssignTicketRequest) {
		return api.put<Ticket>(`/tickets/${id}/assign`, payload);
	},

	addComment(ticketId: string, payload: CreateCommentRequest) {
		return api.post<TicketComment>(`/tickets/${ticketId}/comments`, payload);
	},

	updateComment(ticketId: string, commentId: string, payload: UpdateCommentRequest) {
		return api.put<TicketComment>(`/tickets/${ticketId}/comments/${commentId}`, payload);
	},

	deleteComment(ticketId: string, commentId: string) {
		return api.delete<void>(`/tickets/${ticketId}/comments/${commentId}`);
	},

	listAuditLogs({ entityType, action, userId, page = 0, size = 20 }: ListAuditLogsParams = {}) {
		return api.get<PaginatedAuditLogResponse>("/audit-logs", {
			params: {
				entityType: entityType || undefined,
				action: action || undefined,
				userId: userId || undefined,
				page,
				size,
			},
		});
	},
};

export default ticketApi;
