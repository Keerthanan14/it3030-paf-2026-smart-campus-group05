import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ResourceCalendarPage from './ResourceCalendarPage';
import { useResourceAvailability } from '../../features/resources/hooks/useResourceAvailability';

vi.mock('../../features/resources/hooks/useResourceAvailability', () => ({
  useResourceAvailability: vi.fn(),
}));

vi.mock('../../features/resources/components/ResourceAvailabilityCalendar', () => ({
  ResourceAvailabilityCalendar: ({
    onRangeChange,
  }: {
    onRangeChange: (from: string, to: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onRangeChange('2026-04-01', '2026-04-07')}>
        Week View Navigation
      </button>
      <button type="button" onClick={() => onRangeChange('2026-04-01', '2026-04-30')}>
        Month View Navigation
      </button>
    </div>
  ),
}));

describe('ResourceCalendarPage', () => {
  it('triggers range updates for week and month view navigation', async () => {
    const user = userEvent.setup();
    const setRange = vi.fn();

    vi.mocked(useResourceAvailability).mockReturnValue({
      from: '2026-04-01',
      to: '2026-04-30',
      setFrom: vi.fn(),
      setTo: vi.fn(),
      setRange,
      shiftRange: vi.fn(),
      setPresetRange: vi.fn(),
      data: null,
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/resources/resource-1/calendar']}>
        <Routes>
          <Route path="/resources/:id/calendar" element={<ResourceCalendarPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useResourceAvailability).toHaveBeenCalledWith('resource-1');

    await user.click(screen.getByRole('button', { name: 'Week View Navigation' }));
    await user.click(screen.getByRole('button', { name: 'Month View Navigation' }));

    expect(setRange).toHaveBeenNthCalledWith(1, '2026-04-01', '2026-04-07');
    expect(setRange).toHaveBeenNthCalledWith(2, '2026-04-01', '2026-04-30');
  });
});
