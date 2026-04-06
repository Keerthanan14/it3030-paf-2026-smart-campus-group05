import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ResourceItem } from '../../types/resource';
import ResourceDetailPage from './ResourceDetailPage';
import { useResourceDetail } from '../../features/resources/hooks/useResourceDetail';

vi.mock('../../features/resources/hooks/useResourceDetail', () => ({
  useResourceDetail: vi.fn(),
}));

vi.mock('../../core/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) => selector({ user: { role: 'STUDENT' } }),
}));

const activeResource: ResourceItem = {
  id: 'resource-42',
  name: 'Physics Lab',
  type: 'LAB',
  capacity: 40,
  location: 'Block B',
  description: 'Lab for experiments',
  availabilityWindows: {},
  status: 'ACTIVE',
  createdAt: '2026-04-01T10:00:00',
  updatedAt: '2026-04-01T10:00:00',
  _links: {
    book: { href: '/api/bookings' },
    availability: { href: '/api/resources/resource-42/availability' },
    update: { href: '/api/resources/resource-42' },
  },
};

function BookingRouteProbe() {
  const location = useLocation();
  return <p data-testid="booking-search">{location.search}</p>;
}

describe('ResourceDetailPage', () => {
  it('navigates to booking page with prefilled resourceId when Book Now is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useResourceDetail).mockReturnValue({
      resource: activeResource,
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/resources/resource-42']}>
        <Routes>
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/student/booking" element={<BookingRouteProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByText('Book Now'));

    expect(screen.getByTestId('booking-search')).toHaveTextContent('?resourceId=resource-42');
  });
});
