import api from './client';
import type { PaginatedResourceResponse, ResourceFilters, ResourceStatus } from '../../types/resource';

interface ListParams {
	page?: number;
	size?: number;
	filters?: Partial<ResourceFilters>;
}

export const resourceApi = {
	listResources({ page = 0, size = 10, filters = {} }: ListParams) {
		return api.get<PaginatedResourceResponse>('/resources', {
			params: {
				page,
				size,
				keyword: filters.keyword || undefined,
				location: filters.location || undefined,
				capacity: filters.capacity || undefined,
				type: filters.type || undefined,
				status: filters.status || undefined,
			},
		});
	},

	updateStatus(id: string, status: ResourceStatus) {
		return api.patch(`/resources/${id}/status`, { status });
	},

	deleteResource(id: string) {
		return api.delete(`/resources/${id}`);
	},
};
