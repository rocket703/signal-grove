"use client";

import { Sparkline } from "@/components/sparkline";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
  StatTile,
} from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  domainGeoPrompts,
  domainIssues,
  domainKeywords,
  getActiveDomain,
  latestHealth,
  priorityTone,
} from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

export default function OverviewPage() {
  const { state, loading, error, reload } = useStore();

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Noch keine Domain"
        description="Lege eine Domain an, um SEO- und GEO-Signale in einem Workspace zu bündeln."
      />
    );
  }

  const health = state.healthHistory[domain.id] ?? [];
  const latest = latestHealth(health);
  const issues = domainIssues(state, domain.id)
    .filter((i) => i.status === "open")
    .sort((a, b) => a.priority.localeCompare(b.priority));
  const keywords = domainKeywords(state, domain.id);
  const geos = domainGeoPrompts(state, domain.id);
  const cited = geos.filter((g) => g.cited).length;
  const audit = state.audits[domain.id];

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Overview"
        description={`Health und Fokus für ${domain.displayName} — klassisches SEO und AI/GEO Sichtbarkeit im gleichen Blick.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Health Score"
          value={latest?.overall ?? "–"}
          hint="Kombiniert SEO + GEO"
        >
          <Sparkline
            values={health.map((h) => h.overall)}
            className="text-[var(--signal)]"
          />
        </StatTile>
        <StatTile label="SEO" value={latest?.seo ?? "–"} hint={audit ? `Audit ${audit.score}` : "Kein Audit"}>
          <Sparkline values={health.map((h) => h.seo)} className="text-[var(--ink)]" />
        </StatTile>
        <StatTile
          label="GEO"
          value={latest?.geo ?? "–"}
          hint={`${cited}/${geos.length || 0} Prompts zitiert`}
        >
          <Sparkline
            values={health.map((h) => h.geo)}
            className="text-[var(--signal-2)]"
          />
        </StatTile>
        <StatTile
          label="Keywords"
          value={keywords.length}
          hint="Mit Positionsverlauf"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="SEO vs GEO"
          description="Zwei Sichtbarkeitsachsen — Suche und generative Antworten."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[var(--accent)]/50 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Classic SEO
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                Technischer Audit-Score {audit?.score ?? "–"},{" "}
                {keywords.filter((k) => (k.history.at(-1)?.position ?? 99) <= 10).length} Keywords
                in den Top 10.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <a href="/audit">Zum Audit</a>
              </Button>
            </div>
            <div className="rounded-lg bg-[#f6ebe3] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Generative GEO
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                Citation Likelihood Ø{" "}
                {geos.length
                  ? Math.round(
                      geos.reduce((a, g) => a + g.citationLikelihood, 0) / geos.length
                    )
                  : "–"}
                %. Share-of-Answer Trend unter GEO.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <a href="/geo">Zur GEO-Ansicht</a>
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          title="Top Issues"
          description="Priorisierte Handlungen aus SEO und GEO."
          action={
            <Button asChild variant="ghost" size="sm">
              <a href="/issues">Alle</a>
            </Button>
          }
        >
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offenen Issues — stark.</p>
          ) : (
            <ul className="space-y-2">
              {issues.slice(0, 5).map((issue) => (
                <li
                  key={issue.id}
                  className="flex items-start gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
                >
                  <Badge className={priorityTone(issue.priority)} variant="secondary">
                    {issue.priority}
                  </Badge>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{issue.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{issue.area}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
