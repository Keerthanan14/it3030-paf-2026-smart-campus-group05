interface ResourcePaginationProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ResourcePagination({
  page,
  size,
  totalPages,
  totalElements,
  loading,
  onPageChange,
  onPageSizeChange,
}: ResourcePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-4">
      <p className="text-sm text-foreground/70">
        Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total resources)
      </p>
      <div className="flex items-center gap-2">
        <select
          className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
          value={size}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
        </select>
        <button
          type="button"
          className="rounded-md border border-border/70 px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page <= 0 || loading}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-md border border-border/70 px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={loading || totalPages === 0 || page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
