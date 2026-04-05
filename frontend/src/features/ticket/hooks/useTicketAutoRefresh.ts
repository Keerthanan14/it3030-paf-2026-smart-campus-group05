import { useEffect } from "react";

type UseTicketAutoRefreshOptions = {
  enabled: boolean;
  intervalMs?: number;
  onRefresh: () => Promise<unknown>;
};

export function useTicketAutoRefresh({ enabled, intervalMs = 20000, onRefresh }: UseTicketAutoRefreshOptions) {
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void onRefresh();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs, onRefresh]);
}

export default useTicketAutoRefresh;
