"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  const dependencyKey = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => setRefreshCount(prev => prev + 1), []);

  useEffect(() => {
    let mounted = true;

    void Promise.resolve().then(async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const value = await loadRef.current();
        if (mounted) {
          setData(value);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unexpected error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [dependencyKey, refreshCount]);

  return { data, loading, error, setData, refresh };
}
