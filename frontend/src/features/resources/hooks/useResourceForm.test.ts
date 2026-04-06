import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useResourceForm } from './useResourceForm';
import { resourceApi } from '../../../core/api/resourceApi';

vi.mock('../../../core/api/resourceApi', () => ({
  resourceApi: {
    getResourceById: vi.fn(),
    createResource: vi.fn(),
    updateResource: vi.fn(),
  },
}));

describe('useResourceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when create succeeds', async () => {
    vi.mocked(resourceApi.createResource).mockResolvedValue({} as never);

    const { result } = renderHook(() => useResourceForm());

    let ok = false;
    await act(async () => {
      ok = await result.current.save();
    });

    expect(ok).toBe(true);
    expect(resourceApi.createResource).toHaveBeenCalledTimes(1);
  });

  it('returns false and sets error when create fails', async () => {
    vi.mocked(resourceApi.createResource).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useResourceForm());

    let ok = true;
    await act(async () => {
      ok = await result.current.save();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe('fail');
  });
});
