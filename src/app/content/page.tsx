"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
  StatTile,
} from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getActiveDomain } from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

export default function ContentPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();
  const [source, setSource] = useState("");
  const [text, setText] = useState("");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Content Insights"
        description="Analysiere eine URL-Beschreibung oder eingefügten Text auf SEO-Basics und Lesbarkeit."
      />
    );
  }

  const insights = state.contentInsights.filter((c) => c.domainId === domain.id);
  const latest = insights[0];

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="On-Page / Content Insights"
        description="Paste Content oder eine URL-Referenz — lokale Heuristiken für Länge, Struktur und Lesbarkeit."
      />

      <Panel title="Inhalt analysieren">
        <div className="grid gap-3">
          <Input
            placeholder="Quelle (URL oder Titel)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <Textarea
            placeholder="Text hier einfügen…"
            className="min-h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              disabled={!text.trim() || refreshing}
              onClick={() => {
                void run({
                  action: "analyzeContent",
                  domainId: domain.id,
                  source: source || "paste",
                  text,
                }).then((s) => {
                  if (s) toast.success("Analyse gespeichert");
                });
              }}
            >
              Analysieren
            </Button>
          </div>
        </div>
      </Panel>

      {!latest ? (
        <EmptyState
          title="Noch keine Analyse"
          description="Füge einen Artikelentwurf ein, um Keyword-Dichte, Lesbarkeit und Struktur-Signale zu sehen."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Wörter" value={latest.wordCount} />
            <StatTile label="Lesbarkeit" value={latest.readabilityScore} />
            <StatTile label="H2s" value={latest.h2Count} />
            <StatTile label="Keyword-Dichte %" value={latest.keywordDensity} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Stärken">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {latest.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Panel>
            <Panel title="Issues">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {latest.issues.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Panel>
          </div>
          {insights.length > 1 ? (
            <Panel title="Historie">
              <ul className="space-y-2 text-sm">
                {insights.slice(1).map((c) => (
                  <li key={c.id} className="flex justify-between gap-2 border-b border-[var(--line)] py-2">
                    <span className="truncate">{c.source}</span>
                    <span className="text-muted-foreground">
                      {c.wordCount} Wörter · {new Date(c.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      )}
    </div>
  );
}
