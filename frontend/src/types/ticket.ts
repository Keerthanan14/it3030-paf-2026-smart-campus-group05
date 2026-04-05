export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TicketAttachment {
	id: string;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	createdAt: string;
}

export interface TicketComment {
	id: string;
	ticketId: string;
	userId: string;
	userName: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface Ticket {
	id: string;
	userId: string;
	userName: string;
	resourceId: string | null;
	resourceName: string | null;
	category: string;
	description: string;
	priority: TicketPriority;
	status: TicketStatus;
	assignedToId: string | null;
	assignedToName: string | null;
	resolutionNotes: string | null;
	rejectionReason: string | null;
	preferredContact: string | null;
	firstResponseAt: string | null;
	resolvedAt: string | null;
	timeToFirstResponse: string | null;
	timeToResolution: string | null;
	firstResponseBreached: boolean;
	resolutionBreached: boolean;
	links: Record<string, string>;
	attachments: TicketAttachment[];
	comments: TicketComment[];
	createdAt: string;
	updatedAt: string;
}

export interface TicketFilters {
	status?: TicketStatus;
	priority?: TicketPriority;
	category?: string;
	assignedTo?: string;
	slaBreached?: boolean;
}

export interface PaginatedTicketsResponse {
	content: Ticket[];
	totalElements: number;
	totalPages: number;
	currentPage: number;
	size: number;
}

export interface CreateTicketRequest {
	resourceId?: string;
	category: string;
	description: string;
	priority: TicketPriority;
	preferredContact?: string;
}

export interface UpdateTicketStatusRequest {
	status: TicketStatus;
	resolutionNotes?: string;
	rejectionReason?: string;
}

export interface AssignTicketRequest {
	technicianId: string;
}

export interface CreateCommentRequest {
	content: string;
}

export interface UpdateCommentRequest {
	content: string;
}

export interface AuditLogItem {
	id: string;
	userId: string | null;
	userEmail: string | null;
	userName: string | null;
	action: string;
	entityType: string;
	entityId: string;
	oldValue: Record<string, unknown> | null;
	newValue: Record<string, unknown> | null;
	createdAt: string;
}

export interface PaginatedAuditLogResponse {
	content: AuditLogItem[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
}

