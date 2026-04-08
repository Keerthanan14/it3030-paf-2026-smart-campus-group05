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
  building: 'MAIN',
  floor: 1,
  location: 'Block A',
  allowBookings: true,
  allowRequests: false,
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
    expect(screen.getByText('Main Building 1 st Floor')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit resource')).toBeInTheDocument();
    expect(screen.getByText('Out of Service')).toBeInTheDocument();
  });

  it('hides admin actions when canManage is false', () => {
    render(
      <MemoryRouter>
        <ResourceTable items={[item]} loading={false} canManage={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.queryByLabelText('Edit resource')).not.toBeInTheDocument();
    expect(screen.queryByText('Out of Service')).not.toBeInTheDocument();
  });
});
