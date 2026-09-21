"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ConnectorStatus } from "@/lib/connectors/keys";
import type { AppState } from "@/lib/types";

type ActionPayload = Record<string, unknown> & { action: string };

export type ActionMeta = {
  mode?: string;
  note?: string;
  errors?: string[];
};

type StoreContextValue = {
  state: AppState | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  lastMeta: ActionMeta | null;
  connectors: ConnectorStatus | null;
  reload: () => Promise<void>;
  refreshConnectors: () => Promise<void>;
  run: (payload: ActionPayload) => Promise<{ state: AppState | null; meta: ActionMeta | null }>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<ActionMeta | null>(null);
  const [connectors, setConnectors] = useState<ConnectorStatus | null>(null);

  const refreshConnectors = useCallback(async () => {
    try {
      const res = await fetch("/api/connectors", { cache: "no-store" });
      if (!res.ok) return;
      setConnectors((await res.json()) as ConnectorStatus);
    } catch {
      // ignore status fetch errors
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Daten konnten nicht geladen werden.");
      const data = (await res.json()) as AppState;
      setState(data);
      setError(null);
      await refreshConnectors();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [refreshConnectors]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stateRes, connRes] = await Promise.all([
          fetch("/api/state", { cache: "no-store" }),
          fetch("/api/connectors", { cache: "no-store" }),
        ]);
        if (!stateRes.ok) throw new Error("Daten konnten nicht geladen werden.");
        const data = (await stateRes.json()) as AppState;
        if (!cancelled) {
          setState(data);
          setError(null);
          if (connRes.ok) {
            setConnectors((await connRes.json()) as ConnectorStatus);
          }
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

  const run = useCallback(
    async (payload: ActionPayload) => {
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
        const { _meta, ...rest } = data as AppState & { _meta?: ActionMeta };
        const meta = _meta ?? null;
        setState(rest as AppState);
        setLastMeta(meta);
        setError(null);
        await refreshConnectors();
        return { state: rest as AppState, meta };
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen");
        return { state: null, meta: null };
      } finally {
        setRefreshing(false);
      }
    },
    [refreshConnectors]
  );

  const value = useMemo(
    () => ({
      state,
      loading,
      error,
      refreshing,
      lastMeta,
      connectors,
      reload,
      refreshConnectors,
      run,
    }),
    [
      state,
      loading,
      error,
      refreshing,
      lastMeta,
      connectors,
      reload,
      refreshConnectors,
      run,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
