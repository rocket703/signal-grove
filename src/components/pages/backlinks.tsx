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
  const [csv, setCsv] = useState("");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Backlinks"
        description="Authority-Panel — Import aus Google Search Console (CSV) oder JSON."
      />
    );
  }

  const links = domainBacklinks(state, domain.id);
  const uniqueDomains = new Set(links.map((l) => l.referringDomain)).size;
  const avgDr = links.length
    ? Math.round(links.reduce((a, b) => a + b.dr, 0) / links.length)
    : 0;
  const neu = links.filter((l) => l.status === "new").length;
  const lost = links.filter((l) => l.status === "lost").length;

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Backlinks / Authority"
        description="GSC-CSV oder JSON importieren. Kein Live-Crawler — DR in der Tabelle ist nur ein Proxy, kein Ahrefs-DR."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Links" value={links.length} hint={`${uniqueDomains} Domains`} />
        <StatTile label="Ø Score" value={avgDr} hint="Proxy, kein echter DR" />
        <StatTile label="New / Lost" value={`${neu} / ${lost}`} />
      </div>

      <Panel
        title="Google Search Console CSV"
        description="Export „Latest links“ oder „Top linking sites“ hier einfügen oder als Datei wählen. Ersetzt die bisherigen Backlinks dieser Domain."
      >
        <input
          type="file"
          accept=".csv,text/csv"
          className="mb-3 block w-full text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setCsv(String(reader.result || ""));
            reader.readAsText(file);
          }}
        />
        <Textarea
          className="min-h-36 font-mono text-xs"
          placeholder="CSV-Inhalt einfügen (inkl. Header-Zeile)…"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button
            disabled={refreshing || !csv.trim()}
            onClick={() => {
              void run({ action: "importGscCsv", domainId: domain.id, csv }).then((r) => {
                if (r.state) {
                  toast.success(r.meta?.note || "GSC-CSV importiert");
                  setCsv("");
                }
              });
            }}
          >
            GSC-CSV importieren
          </Button>
        </div>
      </Panel>

      {links.length === 0 ? (
        <EmptyState
          title="Keine Backlinks"
          description="Importiere den GSC-Export oben — z. B. startplatzboerse.com-Latest links-….csv"
        />
      ) : (
        <Panel title={`Referring Domains (${uniqueDomains})`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Anchor / Ziel</TableHead>
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
                  <TableCell className="max-w-xs truncate">{l.anchor}</TableCell>
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
          className="min-h-28 font-mono text-xs"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() => {
              try {
                const items = JSON.parse(json) as unknown[];
                if (!Array.isArray(items)) throw new Error("Array erwartet");
                void run({ action: "importBacklinks", domainId: domain.id, items }).then(
                  (r) => {
                    if (r.state) toast.success(r.meta?.note || "Backlinks importiert");
                  }
                );
              } catch {
                toast.error("Ungültiges JSON");
              }
            }}
          >
            JSON importieren
          </Button>
        </div>
      </Panel>
    </div>
  );
}
