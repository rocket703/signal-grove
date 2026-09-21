"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/use-store";

function StatusRow({
  label,
  mode,
  detail,
}: {
  label: string;
  mode: string;
  detail: string;
}) {
  const live = mode === "live";
  const manual = mode === "manual";
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--line)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
      <Badge
        variant="secondary"
        className={
          live
            ? "bg-emerald-500/15 text-emerald-800"
            : manual
              ? "bg-sky-500/15 text-sky-800"
              : "bg-amber-500/15 text-amber-900"
        }
      >
        {live ? "live" : manual ? "manuell" : "offline / mock"}
      </Badge>
    </div>
  );
}

export default function SettingsPage() {
  const { state, loading, error, reload, run, refreshing, connectors, refreshConnectors } =
    useStore();
  const [draft, setDraft] = useState<{
    serpapi: string;
    openai: string;
    pagespeed: string;
  } | null>(null);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const keys = draft ?? {
    serpapi: state.settings.apiKeys.serpapi || "",
    openai: state.settings.apiKeys.openai || "",
    pagespeed: state.settings.apiKeys.pagespeed || "",
  };

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Settings"
        description="Persistenz, Connector-Status und API-Keys. Env-Vars überschreiben Settings-Keys."
      />

      <Panel title="Connector-Status" action={
        <Button variant="ghost" size="sm" onClick={() => void refreshConnectors()}>
          Aktualisieren
        </Button>
      }>
        {connectors ? (
          <div className="space-y-2">
            <StatusRow label="Technical Audit" {...connectors.audit} />
            <StatusRow label="Content Insights" {...connectors.content} />
            <StatusRow label="SERP / Keywords" {...connectors.serp} />
            <StatusRow label="GEO / OpenAI" {...connectors.geo} />
            <StatusRow label="PageSpeed" {...connectors.pagespeed} />
            <StatusRow label="Backlinks" {...connectors.backlinks} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Status wird geladen…</p>
        )}
      </Panel>

      <Panel title="Persistenz">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Data directory / file</dt>
            <dd className="font-mono text-xs">{state.settings.dataDirLabel}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Env override</dt>
            <dd className="font-mono text-xs">DATA_DIR oder SEOGEO_DATA_DIR</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Google Search Console</dt>
            <dd>{state.settings.gscConnected ? "Stub an" : "Stub — nicht verbunden"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() =>
              void run({
                action: "updateSettings",
                settings: { gscConnected: !state.settings.gscConnected },
              }).then((r) => {
                if (r.state) toast.message("GSC-Stub umgeschaltet");
              })
            }
          >
            GSC Stub toggeln
          </Button>
          <Button
            variant="destructive"
            disabled={refreshing}
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                !window.confirm("Seed-Daten (startplatzboerse.com) wirklich zurücksetzen?")
              ) {
                return;
              }
              void run({ action: "resetDemo" }).then((r) => {
                if (r.state) {
                  setDraft(null);
                  toast.success("Seed-Daten wiederhergestellt");
                }
              });
            }}
          >
            Seed zurücksetzen
          </Button>
        </div>
      </Panel>

      <Panel
        title="API Keys"
        description="Für Live-SERP und Live-GEO. Alternativ Env: SERPAPI_KEY, OPENAI_API_KEY, PAGESPEED_API_KEY (Env hat Vorrang)."
      >
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="serpapi">SerpAPI</Label>
            <Input
              id="serpapi"
              type="password"
              placeholder="serpapi key…"
              value={keys.serpapi}
              onChange={(e) => setDraft({ ...keys, serpapi: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="openai">OpenAI (oder kompatibel via OPENAI_BASE_URL)</Label>
            <Input
              id="openai"
              type="password"
              placeholder="sk-…"
              value={keys.openai}
              onChange={(e) => setDraft({ ...keys, openai: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pagespeed">PageSpeed Insights</Label>
            <Input
              id="pagespeed"
              type="password"
              placeholder="Google API key…"
              value={keys.pagespeed}
              onChange={(e) => setDraft({ ...keys, pagespeed: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            disabled={refreshing}
            onClick={() =>
              void run({
                action: "updateSettings",
                settings: {
                  apiKeys: {
                    serpapi: keys.serpapi || undefined,
                    openai: keys.openai || undefined,
                    pagespeed: keys.pagespeed || undefined,
                  },
                },
              }).then((r) => {
                if (r.state) {
                  setDraft(null);
                  toast.success("Keys gespeichert");
                  void refreshConnectors();
                }
              })
            }
          >
            Speichern
          </Button>
        </div>
      </Panel>
    </div>
  );
}
