import type { AppState, Domain, HealthPoint } from "./types";

export function getActiveDomain(state: AppState): Domain | null {
  if (!state.activeDomainId) return null;
  return state.domains.find((d) => d.id === state.activeDomainId) ?? null;
}

export function domainKeywords(state: AppState, domainId: string) {
  return state.keywords.filter((k) => k.domainId === domainId);
}

export function domainIssues(state: AppState, domainId: string) {
  return state.issues.filter((i) => i.domainId === domainId);
}

export function domainCompetitors(state: AppState, domainId: string) {
  return state.competitors.filter((c) => c.domainId === domainId);
}

export function domainBacklinks(state: AppState, domainId: string) {
  return state.backlinks.filter((b) => b.domainId === domainId);
}

export function domainGeoPrompts(state: AppState, domainId: string) {
  return state.geoPrompts.filter((g) => g.domainId === domainId);
}

export function latestHealth(history: HealthPoint[] | undefined) {
  if (!history?.length) return null;
  return history[history.length - 1];
}

export function avgPosition(history: { position: number | null }[]): number | null {
  const vals = history.map((h) => h.position).filter((p): p is number => p != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function positionDelta(history: { position: number | null }[]): number | null {
  if (history.length < 2) return null;
  const a = history[history.length - 2]?.position;
  const b = history[history.length - 1]?.position;
  if (a == null || b == null) return null;
  return a - b; // positive = improved
}

export function severityLabel(s: string): string {
  switch (s) {
    case "critical":
      return "Kritisch";
    case "warning":
      return "Warnung";
    case "info":
      return "Hinweis";
    case "ok":
      return "OK";
    default:
      return s;
  }
}

export function priorityTone(p: string): string {
  switch (p) {
    case "P0":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    case "P1":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
    case "P2":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function formatHost(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export function emptyDomainBundle() {
  const today = new Date().toISOString().slice(0, 10);
  const health: HealthPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      seo: 50,
      geo: 30,
      overall: 40,
    };
  });
  return {
    health,
    geoSeries: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (6 - i));
      return {
        date: d.toISOString().slice(0, 10),
        shareOfAnswer: 5 + i,
        citationLikelihood: 20 + i * 2,
        mentionRate: 10 + i,
      };
    }),
    today,
  };
}
