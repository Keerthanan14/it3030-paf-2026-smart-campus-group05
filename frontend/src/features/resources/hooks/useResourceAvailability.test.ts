import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useResourceAvailability } from './useResourceAvailability';
import { resourceApi } from '../../../core/api/resourceApi';

vi.mock('../../../core/api/resourceApi', () => ({
  resourceApi: {
    getAvailability: vi.fn(),
  },
}));

describe('useResourceAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resourceApi.getAvailability).mockResolvedValue({
      data: {
        resourceId: 'r1',
        resourceName: 'Lab A',
        availabilityWindows: {},
        bookedSlots: [],
      },
    } as never);
  });

  it('fetches availability on mount', async () => {
    renderHook(() => useResourceAvailability('r1'));

    await waitFor(() => {
      expect(resourceApi.getAvailability).toHaveBeenCalled();
    });
  });

  it('fetches again when range changes via navigation helpers', async () => {
    const { result } = renderHook(() => useResourceAvailability('r1'));

    await waitFor(() => {
      expect(resourceApi.getAvailability).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.shiftRange(7);
    });

    await waitFor(() => {
      expect(resourceApi.getAvailability).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      result.current.setPresetRange(30);
    });

    await waitFor(() => {
      expect(resourceApi.getAvailability).toHaveBeenCalledTimes(3);
    });
  });
});
