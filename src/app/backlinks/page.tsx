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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { domainBacklinks, getActiveDomain } from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

export default function BacklinksPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();
  const [json, setJson] = useState(
    '[\n  {"referringDomain":"example.com","dr":55,"anchor":"Marke","status":"new"}\n]'
  );

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Backlinks"
        description="Authority-Panel mit Referring Domains, DR-ähnlichem Score und New/Lost."
      />
    );
  }

  const links = domainBacklinks(state, domain.id);
  const avgDr = links.length
    ? Math.round(links.reduce((a, b) => a + b.dr, 0) / links.length)
    : 0;
  const neu = links.filter((l) => l.status === "new").length;
  const lost = links.filter((l) => l.status === "lost").length;

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Backlinks / Authority"
        description="Kein kostenloser Live-Backlink-Provider — Daten nur per JSON-Import / manuell. Keine Fake-„Live“-Zahlen."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Referring Domains" value={links.length} />
        <StatTile label="Ø DR" value={avgDr} hint="Demo-Score" />
        <StatTile label="New / Lost" value={`${neu} / ${lost}`} />
      </div>

      {links.length === 0 ? (
        <EmptyState
          title="Keine Backlinks"
          description="Keine Backlinks geladen. Importiere JSON von einem Provider-Export — Signal Grove erfindet keine Live-Links."
        />
      ) : (
        <Panel title="Referring Domains">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>DR</TableHead>
                <TableHead>Anchor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium">{l.referringDomain}</div>
                    <div className="max-w-xs truncate text-xs text-muted-foreground">{l.url}</div>
                  </TableCell>
                  <TableCell>{l.dr}</TableCell>
                  <TableCell>{l.anchor}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        l.status === "new"
                          ? "bg-emerald-500/15 text-emerald-800"
                          : l.status === "lost"
                            ? "bg-rose-500/15 text-rose-800"
                            : ""
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.lastSeen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      <Panel
        title="JSON Import"
        description='Array von Objekten mit referringDomain, dr, anchor, url, status ("active"|"new"|"lost").'
      >
        <Textarea
          className="min-h-32 font-mono text-xs"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <Button
            disabled={refreshing}
            onClick={() => {
              try {
                const items = JSON.parse(json) as unknown[];
                if (!Array.isArray(items)) throw new Error("Array erwartet");
                void run({ action: "importBacklinks", domainId: domain.id, items }).then(
                  (r) => {
                    if (r.state) toast.success("Backlinks importiert (manuell)");
                  }
                );
              } catch {
                toast.error("Ungültiges JSON");
              }
            }}
          >
            Importieren
          </Button>
        </div>
      </Panel>
    </div>
  );
}
