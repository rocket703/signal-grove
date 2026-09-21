"use client";

import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { getActiveDomain, latestHealth } from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

export default function ReportsPage() {
  const { state, loading, error, reload } = useStore();

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Reports"
        description="Exportiere einen Markdown- oder druckbaren HTML-Report für die aktive Domain."
      />
    );
  }

  const health = latestHealth(state.healthHistory[domain.id]);

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Reports"
        description={`Snapshot für ${domain.displayName} — Health ${health?.overall ?? "–"}, bereit zum Teilen.`}
      />

      <Panel
        title="Export"
        description="Markdown-Datei herunterladen oder HTML in neuem Tab öffnen (drucken über Browser)."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/api/report?format=markdown" download={`${domain.hostname}-report.md`}>
              Markdown herunterladen
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/report?format=html" target="_blank" rel="noreferrer">
              HTML öffnen / drucken
            </a>
          </Button>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Enthält Overview-KPIs, Top Issues, Keywords, GEO-Prompts, Competitors und Audit-Checks.</li>
          <li>Daten stammen aus dem lokalen Store — keine Cloud-Abhängigkeit.</li>
        </ul>
      </Panel>
    </div>
  );
}
