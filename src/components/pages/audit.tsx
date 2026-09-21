"use client";

import { toast } from "sonner";
import { Sparkline } from "@/components/sparkline";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveDomain, severityLabel } from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

const severityClass: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-800",
  warning: "bg-amber-500/15 text-amber-900",
  info: "bg-sky-500/15 text-sky-900",
  ok: "bg-emerald-500/15 text-emerald-900",
};

export default function AuditPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Audit braucht eine Domain"
        description="Wähle oder lege eine Domain an, dann prüfe Title, Meta, Canonical, robots und mehr."
      />
    );
  }

  const audit = state.audits[domain.id];

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Technisches SEO Audit"
        description="Leichtgewichtiger Homepage-Check per echtem HTTP-Fetch: robots, title, meta, H1, canonical, OG, Sitemap-Hinweis, Ladezeit (optional PageSpeed)."
        actions={
          <Button
            disabled={refreshing}
            onClick={() => {
              void run({ action: "runAudit", domainId: domain.id }).then((r) => {
                if (r.state) {
                  toast.success(r.meta?.note || "Live-Audit abgeschlossen");
                }
              });
            }}
          >
            {refreshing ? "Läuft…" : "Audit starten"}
          </Button>
        }
      />

      {!audit ? (
        <EmptyState
          title="Noch kein Audit"
          description="Starte den ersten Lauf. Findings stammen aus dem echten HTML der Domain — bei Fetch-Fehler wird ehrlich fehlgeschlagen, nicht simuliert."
          action={
            <Button
              disabled={refreshing}
              onClick={() => void run({ action: "runAudit", domainId: domain.id })}
            >
              Jetzt prüfen
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Panel title="Score">
              <div className="font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--ink)]">
                {audit.score}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {audit.url} · {new Date(audit.ranAt).toLocaleString("de-DE")}
              </p>
            </Panel>
            <Panel title="Meta Snapshot">
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="text-muted-foreground">Title</dt>
                  <dd className="line-clamp-2">{audit.meta.title || "–"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="line-clamp-2">{audit.meta.description || "–"}</dd>
                </div>
              </dl>
            </Panel>
            <Panel title="Technik">
              <ul className="space-y-1 text-sm">
                <li>H1: {audit.meta.h1Count}</li>
                <li>robots.txt: {audit.meta.robotsTxt ? "ja" : "nein"}</li>
                <li>Sitemap-Hinweis: {audit.meta.sitemapHint ? "ja" : "nein"}</li>
                <li>Ladezeit-Proxy: {audit.meta.loadMs ? `${audit.meta.loadMs} ms` : "–"}</li>
              </ul>
            </Panel>
          </div>

          <Panel
            title="Checkliste"
            description="Crawlable Checks mit Fix-Hinweisen — Erweiterungspunkt für echte Crawler."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Fix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.checks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityClass[c.severity] || ""} variant="secondary">
                        {severityLabel(c.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">{c.detail}</TableCell>
                    <TableCell className="max-w-xs">{c.fixHint}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Score-Trend (Health SEO)
            </div>
            <Sparkline
              values={(state.healthHistory[domain.id] || []).map((h) => h.seo)}
              className="h-14 text-[var(--signal)]"
            />
          </div>
        </>
      )}
    </div>
  );
}
