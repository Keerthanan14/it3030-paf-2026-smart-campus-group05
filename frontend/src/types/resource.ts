export type ResourceType =
	| 'ROOM'
	| 'LECTURE_HALL'
	| 'LAB'
	| 'MEETING_ROOM'
	| 'BOARD_ROOM'
	| 'STAFF_ROOM'
	| 'SMART_CLASSROOM'
	| 'EQUIPMENT'
	| 'STUDY_AREA'
	| 'LIBRARY'
	| 'OTHER';

export type BuildingType = 'MAIN' | 'SUB';

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
	building?: BuildingType;
	floor?: number;
	location: string;
	chairCount?: number;
	tableCount?: number;
	pcCount?: number;
	equipmentCount?: number;
	hasAc?: boolean;
	hasFan?: boolean;
	hasProjector?: boolean;
	hasSmartboard?: boolean;
	hasCamera?: boolean;
	hasPodiumWithPc?: boolean;
	hasPodium?: boolean;
	hasWhiteboard?: boolean;
	hasClock?: boolean;
	hasLectureChairs?: boolean;
	hasLectureDesks?: boolean;
	hasSpeakers?: boolean;
	hasPowerOutlets?: boolean;
	hasWifi?: boolean;
	description?: string | null;
	availabilityWindows?: Record<string, AvailabilityWindow> | null;
	status: ResourceStatus;
	allowBookings?: boolean;
	allowRequests?: boolean;
	createdAt: string;
	updatedAt: string;
	_links?: Record<string, { href: string }>;
}

export interface ResourceFormValues {
	name: string;
	type: ResourceType | '';
	capacity: number;
	building: BuildingType | '';
	floor: number | '';
	chairCount: number;
	tableCount: number;
	hasAc: boolean;
	hasFan: boolean;
	hasProjector: boolean;
	hasSmartboard: boolean;
	hasCamera: boolean;
	hasPodiumWithPc: boolean;
	hasPodium: boolean;
	hasWhiteboard: boolean;
	hasClock: boolean;
	hasLectureChairs: boolean;
	hasLectureDesks: boolean;
	hasSpeakers: boolean;
	hasPowerOutlets: boolean;
	hasWifi: boolean;
	pcCount?: number;
	equipmentCount?: number;
	description?: string;
	availabilityWindows?: Record<string, AvailabilityWindow>;
	status?: ResourceStatus;
	allowBookings?: boolean;
	allowRequests?: boolean;
}

export interface ResourceFilters {
	keyword: string;
	location: string;
	type?: ResourceType;
	status?: ResourceStatus;
	allowBookings?: boolean;
	allowRequests?: boolean;
}

export interface PaginatedResourceResponse {
	content: ResourceItem[];
	totalElements: number;
	totalPages: number;
	currentPage: number;
	size: number;
}

export interface BookedSlot {
	date: string;
	startTime: string;
	endTime: string;
	purpose?: string;
}

export interface ResourceAvailabilityResponse {
	resourceId: string;
	resourceName: string;
	availabilityWindows?: Record<string, AvailabilityWindow> | null;
	bookedSlots: BookedSlot[];
}
