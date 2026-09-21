"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppState } from "@/lib/types";

type ActionPayload = Record<string, unknown> & { action: string };

type StoreContextValue = {
  state: AppState | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  reload: () => Promise<void>;
  run: (payload: ActionPayload) => Promise<AppState | null>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Daten konnten nicht geladen werden.");
      const data = (await res.json()) as AppState;
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok) throw new Error("Daten konnten nicht geladen werden.");
        const data = (await res.json()) as AppState;
        if (!cancelled) {
          setState(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unbekannter Fehler");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(async (payload: ActionPayload) => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Aktion fehlgeschlagen");
      }
      const { _meta: _ignored, ...rest } = data as AppState & { _meta?: unknown };
      void _ignored;
      setState(rest as AppState);
      setError(null);
      return rest as AppState;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen");
      return null;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const value = useMemo(
    () => ({ state, loading, error, refreshing, reload, run }),
    [state, loading, error, refreshing, reload, run]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
