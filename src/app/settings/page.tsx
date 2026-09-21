"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/use-store";

export default function SettingsPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();
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
        description="Datenverzeichnis, Demo zurücksetzen und optionale API-Key-Stubs für spätere Live-Connectoren."
      />

      <Panel title="Persistenz">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Data directory / file</dt>
            <dd className="font-mono text-xs">{state.settings.dataDirLabel}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Env override</dt>
            <dd className="font-mono text-xs">SEOGEO_DATA_DIR</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Google Search Console</dt>
            <dd>{state.settings.gscConnected ? "verbunden" : "Stub — nicht verbunden"}</dd>
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
              }).then((s) => {
                if (s) toast.message("GSC-Stub umgeschaltet");
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
                !window.confirm("Demo-Daten wirklich zurücksetzen?")
              ) {
                return;
              }
              void run({ action: "resetDemo" }).then((s) => {
                if (s) {
                  setDraft(null);
                  toast.success("Demo-Daten wiederhergestellt");
                }
              });
            }}
          >
            Demo-Daten zurücksetzen
          </Button>
        </div>
      </Panel>

      <Panel
        title="API Keys (Stubs)"
        description="Keys werden lokal im Store vermerkt. Live-Calls sind noch Mock — Env-Vars SERPAPI_KEY, OPENAI_API_KEY, PAGESPEED_API_KEY haben Vorrang als Extension Points."
      >
        <div className="grid gap-3 sm:grid-cols-1">
          <div className="grid gap-1.5">
            <Label htmlFor="serpapi">SerpAPI / SERP</Label>
            <Input
              id="serpapi"
              type="password"
              placeholder="sk-… (optional)"
              value={keys.serpapi}
              onChange={(e) =>
                setDraft({ ...keys, serpapi: e.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="openai">OpenAI (GEO probes)</Label>
            <Input
              id="openai"
              type="password"
              placeholder="sk-… (optional)"
              value={keys.openai}
              onChange={(e) => setDraft({ ...keys, openai: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pagespeed">PageSpeed Insights</Label>
            <Input
              id="pagespeed"
              type="password"
              placeholder="API key (optional)"
              value={keys.pagespeed}
              onChange={(e) =>
                setDraft({ ...keys, pagespeed: e.target.value })
              }
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
              }).then((s) => {
                if (s) {
                  setDraft(null);
                  toast.success("Settings gespeichert");
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
