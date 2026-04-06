import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceItem } from '../../types/resource';
import AdminResourcesPage from './AdminResourcesPage';
import { useAdminResources } from '../../features/resources/hooks/useAdminResources';

vi.mock('../../features/resources/hooks/useAdminResources', () => ({
  useAdminResources: vi.fn(),
}));

const sampleResource: ResourceItem = {
  id: 'resource-1',
  name: 'Main Hall',
  type: 'ROOM',
  capacity: 120,
  location: 'Block A',
  description: 'Large hall',
  availabilityWindows: {},
  status: 'ACTIVE',
  createdAt: '2026-04-01T10:00:00',
  updatedAt: '2026-04-01T10:00:00',
};

describe('AdminResourcesPage', () => {
  beforeEach(() => {
    const setPage = vi.fn();
    const setPageSize = vi.fn();
    const applyFilters = vi.fn();

    vi.mocked(useAdminResources).mockReturnValue({
      resources: [sampleResource],
      filters: {
        keyword: '',
        location: '',
      },
      loading: false,
      error: null,
      page: 1,
      size: 10,
      totalPages: 4,
      totalElements: 7,
      setPage,
      setPageSize,
      applyFilters,
      updateStatus: vi.fn().mockResolvedValue(undefined),
      removeResource: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('applies filters and supports pagination actions', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminResourcesPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Search by name or description'), 'lab');
    await user.type(screen.getByPlaceholderText('Location'), 'Block C');
    await user.type(screen.getByPlaceholderText('Min capacity'), '40');

    const typeSelect = screen.getByDisplayValue('All types');
    await user.selectOptions(typeSelect, 'LAB');

    const statusSelect = screen.getByDisplayValue('All statuses');
    await user.selectOptions(statusSelect, 'ACTIVE');

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    const hookResult = vi.mocked(useAdminResources).mock.results[0]?.value;
    expect(hookResult).toBeDefined();

    if (!hookResult) {
      throw new Error('Expected useAdminResources hook result to be defined');
    }

    expect(hookResult.applyFilters).toHaveBeenCalledWith({
      keyword: 'lab',
      location: 'Block C',
      capacity: 40,
      type: 'LAB',
      status: 'ACTIVE',
    });

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(hookResult.setPage).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(hookResult.setPage).toHaveBeenCalledWith(2);

    const pageSizeSelect = screen.getByDisplayValue('10 / page');
    await user.selectOptions(pageSizeSelect, '20');
    expect(hookResult.setPageSize).toHaveBeenCalledWith(20);
  });
});
