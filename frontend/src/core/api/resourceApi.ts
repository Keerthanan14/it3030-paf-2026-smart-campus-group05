import api from './client';
import type {
	PaginatedResourceResponse,
	ResourceAvailabilityResponse,
	ResourceFilters,
	ResourceFormValues,
	ResourceItem,
	ResourceStatus,
} from '../../types/resource';

interface ListParams {
	page?: number;
	size?: number;
	filters?: Partial<ResourceFilters>;
}

type MaybeHateoasModel<T> = T & { content?: T };

function unwrapModel<T>(payload: MaybeHateoasModel<T>): T {
	return payload.content ?? payload;
}

function toResourceItem(payload: MaybeHateoasModel<ResourceItem>): ResourceItem {
	return unwrapModel(payload);
}

export const resourceApi = {
	async listResources({ page = 0, size = 10, filters = {} }: ListParams) {
		const response = await api.get<
			PaginatedResourceResponse & {
				_embedded?: { resources?: Array<MaybeHateoasModel<ResourceItem>> };
			}
		>('/resources', {
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

		const payload = response.data;
		const content = payload.content?.length
			? payload.content
			: (payload._embedded?.resources ?? []).map(toResourceItem);

		return {
			...response,
			data: {
				...payload,
				content,
			},
		};
	},

	async getResourceById(id: string) {
		const response = await api.get<MaybeHateoasModel<ResourceItem>>(`/resources/${id}`);
		return {
			...response,
			data: toResourceItem(response.data),
		};
	},

	createResource(payload: ResourceFormValues) {
		return api.post('/resources', payload);
	},

	updateResource(id: string, payload: ResourceFormValues) {
		return api.put(`/resources/${id}`, payload);
	},

	getAvailability(id: string, from: string, to: string) {
		return api.get<ResourceAvailabilityResponse>(`/resources/${id}/availability`, {
			params: { from, to },
		});
	},

	updateStatus(id: string, status: ResourceStatus) {
		return api.patch(`/resources/${id}/status`, { status });
	},

	deleteResource(id: string) {
		return api.delete(`/resources/${id}`);
	},
};
