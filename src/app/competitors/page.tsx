"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  domainCompetitors,
  domainGeoPrompts,
  domainKeywords,
  getActiveDomain,
} from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

export default function CompetitorsPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();
  const [hostname, setHostname] = useState("");
  const [label, setLabel] = useState("");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Competitors"
        description="Vergleiche 2–4 Wettbewerber auf Rankings und GEO-Mentions."
      />
    );
  }

  const competitors = domainCompetitors(state, domain.id);
  const keywords = domainKeywords(state, domain.id);
  const ownAvg =
    keywords.length === 0
      ? null
      : Math.round(
          (keywords.reduce((a, k) => a + (k.history.at(-1)?.position ?? 20), 0) /
            keywords.length) *
            10
        ) / 10;
  const geos = domainGeoPrompts(state, domain.id);
  const ownGeoShare = geos.length
    ? Math.round((geos.filter((g) => g.cited).length / geos.length) * 45)
    : 0;

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Competitors"
        description="Side-by-side Rankings und GEO-Mentions — maximal vier Wettbewerber pro Domain."
      />

      <Panel title="Du vs. Markt">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {domain.displayName}
            </div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">
              Avg Pos {ownAvg ?? "–"}
            </div>
            <div className="text-sm text-muted-foreground">GEO Share ~{ownGeoShare}%</div>
          </div>
          {competitors.slice(0, 2).map((c) => (
            <div key={c.id} className="rounded-lg border border-[var(--line)] p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">
                Avg Pos {c.avgPosition}
              </div>
              <div className="text-sm text-muted-foreground">GEO Share {c.geoShare}%</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Wettbewerber hinzufügen">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void run({
              action: "addCompetitor",
              domainId: domain.id,
              hostname,
              label: label || undefined,
            }).then((s) => {
              if (s) {
                toast.success("Competitor hinzugefügt");
                setHostname("");
                setLabel("");
              }
            });
          }}
        >
          <Input
            placeholder="hostname.de"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
          <Input
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Button type="submit" disabled={!hostname.trim() || refreshing}>
            Hinzufügen
          </Button>
        </form>
      </Panel>

      {competitors.length === 0 ? (
        <EmptyState
          title="Keine Competitors"
          description="Füge bis zu vier Domains hinzu, um Rankings und GEO-Mentions zu vergleichen."
        />
      ) : (
        <Panel title="Vergleichstabelle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Avg Position</TableHead>
                <TableHead>GEO Mentions</TableHead>
                <TableHead>GEO Share</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.hostname}</div>
                  </TableCell>
                  <TableCell>{c.avgPosition}</TableCell>
                  <TableCell>{c.geoMentions}</TableCell>
                  <TableCell>{c.geoShare}%</TableCell>
                  <TableCell>{c.authority}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void run({ action: "removeCompetitor", competitorId: c.id })
                      }
                    >
                      Entfernen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
