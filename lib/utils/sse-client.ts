"use client";

/**
 * Module-level singleton for the /api/notifications/stream EventSource.
 * Multiple components subscribe; one connection is shared. The connection
 * is opened on the first subscriber and closed when the last one unsubscribes.
 * On disconnect, it reconnects with exponential backoff (max 30s).
 */

export type SsePayload = { type: "notification" | "chat" | string; data?: unknown };

type Handler = (payload: SsePayload) => void;

const HEARTBEAT_TIMEOUT_MS = 60_000;
const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

let source: EventSource | null = null;
let subscribers: Set<Handler> = new Set();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastEventAt = 0;
let heartbeatCheckInterval: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function startHeartbeatCheck() {
  if (heartbeatCheckInterval) return;
  heartbeatCheckInterval = setInterval(() => {
    if (subscribers.size === 0) return;
    if (Date.now() - lastEventAt > HEARTBEAT_TIMEOUT_MS && source) {
      try {
        source.close();
      } catch {
        /* noop */
      }
      source = null;
      scheduleReconnect();
    }
  }, 15_000);
}

function stopHeartbeatCheck() {
  if (heartbeatCheckInterval) {
    clearInterval(heartbeatCheckInterval);
    heartbeatCheckInterval = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  if (subscribers.size === 0) return;
  const delay = Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * 2 ** reconnectAttempts);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ensureConnection();
  }, delay);
}

function ensureConnection() {
  if (typeof window === "undefined") return;
  if (typeof EventSource === "undefined") return;
  if (source) return;

  try {
    const es = new EventSource("/api/notifications/stream");
    lastEventAt = Date.now();

    es.onmessage = (event) => {
      lastEventAt = Date.now();
      try {
        const payload = JSON.parse(event.data) as SsePayload;
        if (!payload || typeof payload !== "object" || !payload.type) return;
        subscribers.forEach((handler) => {
          try {
            handler(payload);
          } catch {
            /* swallow handler errors so one bad subscriber doesn't break the rest */
          }
        });
      } catch {
        /* malformed payload — ignore */
      }
    };

    es.onopen = () => {
      reconnectAttempts = 0;
    };

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        try {
          es.close();
        } catch {
          /* noop */
        }
        source = null;
        scheduleReconnect();
      }
    };

    source = es;
    startHeartbeatCheck();
  } catch {
    scheduleReconnect();
  }
}

function teardownConnection() {
  if (source) {
    try {
      source.close();
    } catch {
      /* noop */
    }
    source = null;
  }
  clearReconnectTimer();
  stopHeartbeatCheck();
}

/**
 * Subscribe to the singleton SSE stream. Returns an unsubscribe function.
 * The same connection is shared across all subscribers.
 */
export function subscribeToSSE(handler: Handler): () => void {
  if (typeof window === "undefined") return () => {};
  subscribers.add(handler);
  ensureConnection();
  return () => {
    subscribers.delete(handler);
    if (subscribers.size === 0) {
      teardownConnection();
    }
  };
}

/** Test-only — count of active subscribers (for debugging). */
export function _sseDebug() {
  return {
    subscribers: subscribers.size,
    hasSource: !!source,
    reconnectAttempts,
  };
}
