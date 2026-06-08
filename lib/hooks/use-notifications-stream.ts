"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import type { ApiNotification } from "@/lib/types/api";

/**
 * Stream of the current user's notifications.
 *
 * - Initial fetch happens on mount.
 * - Live updates come from the shared SSE singleton (one connection per tab).
 * - A 60s backstop poll guards against missed events (e.g. SSE briefly down).
 *   60s is long enough to never fight the SSE updates.
 */
export function useNotificationsStream(role: "CLIENT" | "VENDOR" | "DELIVERY" | "ADMIN", intervalMs = 60_000) {
  const [data, setData] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const rows = await listNotifications(role);
      setData(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type === "notification") {
        void refresh();
      }
    });
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [intervalMs, refresh]);

  const markRead = useCallback(
    async (id: number) => {
      await markNotificationRead(role, id);
      setData((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    },
    [role]
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead(role);
    setData((current) =>
      current.map((item) => (item.isRead ? item : { ...item, isRead: true })),
    );
  }, [role]);

  return { data, loading, error, refresh, markRead, markAllRead };
}
