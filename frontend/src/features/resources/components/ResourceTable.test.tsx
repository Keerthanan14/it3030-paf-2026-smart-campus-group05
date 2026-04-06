import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ResourceTable } from './ResourceTable';
import type { ResourceItem } from '../../../types/resource';

const item: ResourceItem = {
  id: '11111111-1111-1111-1111-111111111111',
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

describe('ResourceTable', () => {
  it('shows loading state', () => {
    render(
      <MemoryRouter>
        <ResourceTable items={[]} loading />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading resources...')).toBeInTheDocument();
  });

  it('renders view and edit actions for manageable resources', () => {
    render(
      <MemoryRouter>
        <ResourceTable items={[item]} loading={false} canManage />
      </MemoryRouter>
    );

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Mark OUT_OF_SERVICE')).toBeInTheDocument();
  });

  it('hides admin actions when canManage is false', () => {
    render(
      <MemoryRouter>
        <ResourceTable items={[item]} loading={false} canManage={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark OUT_OF_SERVICE')).not.toBeInTheDocument();
  });
});
