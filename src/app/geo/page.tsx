"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { domainGeoPrompts, getActiveDomain } from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

const ENGINES = ["Perplexity", "ChatGPT", "Gemini", "Claude", "Copilot"] as const;

export default function GeoPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();
  const [prompt, setPrompt] = useState("");
  const [engine, setEngine] = useState<string>("Perplexity");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="GEO / AI Visibility"
        description="Prompt-Bibliothek, Citation Likelihood und Share of AI Answer — first-class, nicht Fußnote."
      />
    );
  }

  const prompts = domainGeoPrompts(state, domain.id);
  const series = state.geoSeries[domain.id] ?? [];
  const latest = series.at(-1);
  const cited = prompts.filter((p) => p.cited).length;
  const avgLikelihood = prompts.length
    ? Math.round(prompts.reduce((a, p) => a + p.citationLikelihood, 0) / prompts.length)
    : 0;

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="GEO / AI Visibility"
        description="Wie erscheint die Marke in KI-Antworten? Prompt Library, Citation Likelihood, Wettbewerber in Answers."
        actions={
          <Button
            disabled={refreshing || !prompts.length}
            onClick={() => {
              void run({ action: "refreshGeo", domainId: domain.id }).then((s) => {
                if (s) toast.success("GEO Refresh (Mock) abgeschlossen");
              });
            }}
          >
            GEO Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Share of AI Answer"
          value={`${latest?.shareOfAnswer ?? 0}%`}
          hint="Simulierter Anteil"
        >
          <Sparkline
            values={series.map((s) => s.shareOfAnswer)}
            className="text-[var(--signal-2)]"
          />
        </StatTile>
        <StatTile label="Citation Likelihood" value={avgLikelihood} hint="Ø über Prompts">
          <Sparkline
            values={series.map((s) => s.citationLikelihood)}
            className="text-[var(--signal)]"
          />
        </StatTile>
        <StatTile label="Mention Rate" value={`${latest?.mentionRate ?? 0}%`} />
        <StatTile label="Zitierte Prompts" value={`${cited}/${prompts.length}`} />
      </div>

      <Panel title="Prompt zur Bibliothek">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            void run({
              action: "addGeoPrompt",
              domainId: domain.id,
              prompt,
              engine,
            }).then((s) => {
              if (s) {
                toast.success("Prompt hinzugefügt");
                setPrompt("");
              }
            });
          }}
        >
          <Input
            placeholder="Welche Agentur hilft bei GEO in DE?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Select value={engine} onValueChange={setEngine}>
            <SelectTrigger>
              <SelectValue placeholder="Engine" />
            </SelectTrigger>
            <SelectContent>
              {ENGINES.map((eng) => (
                <SelectItem key={eng} value={eng}>
                  {eng}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!prompt.trim() || refreshing}>
            Speichern
          </Button>
        </form>
      </Panel>

      {prompts.length === 0 ? (
        <EmptyState
          title="Leere Prompt Library"
          description="Lege 3–5 Buyer-Prompts an, die deine Zielgruppe KI-Systemen stellen würde."
        />
      ) : (
        <Panel
          title="Prompt Results"
          description="Demo + Mock-Refresh. Später: echte Engine-Connectoren via OPENAI_API_KEY / Provider-APIs."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engine</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Cited</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Competitors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Badge variant="outline">{p.engine}</Badge>
                  </TableCell>
                  <TableCell className="max-w-sm text-sm">{p.prompt}</TableCell>
                  <TableCell>
                    {p.cited ? (
                      <Badge className="bg-emerald-500/15 text-emerald-800" variant="secondary">
                        ja
                      </Badge>
                    ) : (
                      <Badge variant="secondary">nein</Badge>
                    )}
                  </TableCell>
                  <TableCell>{p.mentionRank ?? "–"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-[var(--signal)]"
                          style={{ width: `${p.citationLikelihood}%` }}
                        />
                      </div>
                      <span className="text-sm">{p.citationLikelihood}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate text-xs text-muted-foreground">
                    {p.competitorsMentioned.join(", ") || "–"}
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
