"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkline } from "@/components/sparkline";
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
  domainKeywords,
  getActiveDomain,
  positionDelta,
} from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

export default function KeywordsPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();
  const [term, setTerm] = useState("");

  // Seed-Skript / andere Tabs schreiben in store.json — UI neu laden
  useEffect(() => {
    const onFocus = () => {
      void reload();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Keywords brauchen eine Domain"
        description="Tracke Suchbegriffe mit Positionsverlauf. Mit SERPAPI_KEY: Live-SERP. Ohne Key: klar gekennzeichnetes Demo/Mock."
      />
    );
  }

  const keywords = domainKeywords(state, domain.id);

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Keyword / Ranking Tracker"
        description={`${keywords.length} Keywords für ${domain.hostname}. Live via SerpAPI wenn Key gesetzt — sonst Demo/Mock.`}
        actions={
          <>
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={() => {
                void reload().then(() => toast.message("Liste aktualisiert"));
              }}
            >
              Neu laden
            </Button>
            <Button
              variant="secondary"
              disabled={refreshing}
              onClick={() => {
                void run({ action: "seedKeywords", domainId: domain.id }).then((r) => {
                  if (r.state) {
                    toast.success(r.meta?.note || "Keywords geladen");
                  }
                });
              }}
            >
              Startplatz-Keywords laden
            </Button>
            <Button
              variant="outline"
              disabled={refreshing || !keywords.length}
              onClick={() => {
                void run({ action: "refreshKeywords", domainId: domain.id }).then((r) => {
                  if (r.state) {
                    const mode = r.meta?.mode || "mock";
                    if (mode === "live") toast.success(r.meta?.note || "Live-SERP aktualisiert");
                    else toast.message(r.meta?.note || "Demo/Mock-Refresh (kein Live-SERP)");
                  }
                });
              }}
            >
              SERP Refresh
            </Button>
          </>
        }
      />

      <Panel title="Keyword hinzufügen">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void run({ action: "addKeyword", domainId: domain.id, term }).then((r) => {
              if (r.state) {
                toast.success(`„${term}“ getrackt`);
                setTerm("");
              }
            });
          }}
        >
          <Input
            placeholder="z. B. berlin marathon startplatz"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <Button type="submit" disabled={!term.trim() || refreshing}>
            Hinzufügen
          </Button>
        </form>
      </Panel>

      {keywords.length === 0 ? (
        <EmptyState
          title="Keine Keywords"
          description="Klicke „Startplatz-Keywords laden“ oder füge Begriffe manuell hinzu."
          action={
            <Button
              disabled={refreshing}
              onClick={() => {
                void run({ action: "seedKeywords", domainId: domain.id }).then((r) => {
                  if (r.state) toast.success(r.meta?.note || "Keywords geladen");
                });
              }}
            >
              Startplatz-Keywords laden
            </Button>
          }
        />
      ) : (
        <Panel title={`Rankings (${keywords.length})`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Pos.</TableHead>
                <TableHead>Δ</TableHead>
                <TableHead>Vol.</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((kw) => {
                const pos = kw.history.at(-1)?.position;
                const delta = positionDelta(kw.history);
                return (
                  <TableRow key={kw.id}>
                    <TableCell>
                      <div className="font-medium">{kw.term}</div>
                      <div className="text-xs text-muted-foreground">{kw.locale}</div>
                    </TableCell>
                    <TableCell className="font-[family-name:var(--font-display)] text-lg">
                      {pos ?? "–"}
                    </TableCell>
                    <TableCell
                      className={
                        delta == null
                          ? "text-muted-foreground"
                          : delta > 0
                            ? "text-emerald-700"
                            : delta < 0
                              ? "text-rose-700"
                              : ""
                      }
                    >
                      {delta == null ? "–" : delta > 0 ? `+${delta}` : delta}
                    </TableCell>
                    <TableCell>{kw.volume ?? "–"}</TableCell>
                    <TableCell className="w-36">
                      <Sparkline
                        values={kw.history
                          .map((h) => h.position)
                          .filter((p): p is number => p != null)}
                        invert
                        className="text-[var(--signal)]"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
