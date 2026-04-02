export type ResourceType = 'ROOM' | 'LAB' | 'EQUIPMENT';

export type ResourceStatus = 'ACTIVE' | 'OUT_OF_SERVICE';

export interface AvailabilityWindow {
	open: string;
	close: string;
}

export interface ResourceItem {
	id: string;
	name: string;
	type: ResourceType;
	capacity: number;
	location: string;
	description?: string | null;
	availabilityWindows?: Record<string, AvailabilityWindow> | null;
	status: ResourceStatus;
	createdAt: string;
	updatedAt: string;
}

export interface ResourceFilters {
	keyword: string;
	location: string;
	capacity?: number;
	type?: ResourceType;
	status?: ResourceStatus;
}

export interface PaginatedResourceResponse {
	content: ResourceItem[];
	totalElements: number;
	totalPages: number;
	currentPage: number;
	size: number;
}
