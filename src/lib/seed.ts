import type {
  AppState,
  GeoPrompt,
  GeoSeriesPoint,
  HealthPoint,
  Issue,
  Keyword,
} from "./types";

export function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function seriesHealthBaseline(): HealthPoint[] {
  const points: HealthPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    points.push({
      date: daysAgo(i),
      seo: 50,
      geo: 30,
      overall: 40,
    });
  }
  return points;
}

function emptyGeoSeries(): GeoSeriesPoint[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: daysAgo(6 - i),
    shareOfAnswer: 0,
    citationLikelihood: 0,
    mentionRate: 0,
  }));
}

export const DEMO_ID = "dom_startplatzboerse";

const seedKeywords: Keyword[] = [
  { id: "kw_1", domainId: DEMO_ID, term: "startplatzbörse", locale: "de-DE", volume: 320, history: [] },
  { id: "kw_2", domainId: DEMO_ID, term: "marathon startplatz verkaufen", locale: "de-DE", volume: 590, history: [] },
  { id: "kw_3", domainId: DEMO_ID, term: "triathlon startplatz kaufen", locale: "de-DE", volume: 480, history: [] },
  { id: "kw_4", domainId: DEMO_ID, term: "hyrox startplatz", locale: "de-DE", volume: 720, history: [] },
  { id: "kw_5", domainId: DEMO_ID, term: "startplatz kaufen", locale: "de-DE", volume: 880, history: [] },
  { id: "kw_6", domainId: DEMO_ID, term: "startplatz verkaufen", locale: "de-DE", volume: 720, history: [] },
  { id: "kw_7", domainId: DEMO_ID, term: "marathon startplatz kaufen", locale: "de-DE", volume: 640, history: [] },
  { id: "kw_8", domainId: DEMO_ID, term: "berlin marathon startplatz", locale: "de-DE", volume: 1100, history: [] },
  { id: "kw_9", domainId: DEMO_ID, term: "frankfurt marathon startplatz", locale: "de-DE", volume: 540, history: [] },
  { id: "kw_10", domainId: DEMO_ID, term: "ironman startplatz verkaufen", locale: "de-DE", volume: 390, history: [] },
  { id: "kw_11", domainId: DEMO_ID, term: "triathlon startplatz verkaufen", locale: "de-DE", volume: 410, history: [] },
  { id: "kw_12", domainId: DEMO_ID, term: "radrennen startplatz", locale: "de-DE", volume: 260, history: [] },
  { id: "kw_13", domainId: DEMO_ID, term: "halbmarathon startplatz", locale: "de-DE", volume: 480, history: [] },
  { id: "kw_14", domainId: DEMO_ID, term: "ultramarathon startplatz", locale: "de-DE", volume: 210, history: [] },
  { id: "kw_15", domainId: DEMO_ID, term: "hyrox startplatz kaufen", locale: "de-DE", volume: 610, history: [] },
  { id: "kw_16", domainId: DEMO_ID, term: "hyrox startplatz verkaufen", locale: "de-DE", volume: 450, history: [] },
  { id: "kw_17", domainId: DEMO_ID, term: "startplatz tausch", locale: "de-DE", volume: 300, history: [] },
  { id: "kw_18", domainId: DEMO_ID, term: "startplatzbörse marathon", locale: "de-DE", volume: 180, history: [] },
  { id: "kw_19", domainId: DEMO_ID, term: "startplatz inserieren", locale: "de-DE", volume: 170, history: [] },
];

const seedGeoPrompts: GeoPrompt[] = [
  {
    id: "geo_1",
    domainId: DEMO_ID,
    prompt: "Wo kann ich einen Marathon-Startplatz in Deutschland privat verkaufen?",
    engine: "ChatGPT",
    cited: false,
    mentionRank: null,
    competitorsMentioned: [],
    citationLikelihood: 0,
    lastChecked: daysAgo(30),
  },
  {
    id: "geo_2",
    domainId: DEMO_ID,
    prompt: "Welche Plattformen gibt es für den Handel mit Triathlon-Startplätzen?",
    engine: "ChatGPT",
    cited: false,
    mentionRank: null,
    competitorsMentioned: [],
    citationLikelihood: 0,
    lastChecked: daysAgo(30),
  },
  {
    id: "geo_3",
    domainId: DEMO_ID,
    prompt: "Ist Startplatzbörse sicher zum Kaufen von Hyrox-Startplätzen?",
    engine: "ChatGPT",
    cited: false,
    mentionRank: null,
    competitorsMentioned: [],
    citationLikelihood: 0,
    lastChecked: daysAgo(30),
  },
];

const seedIssues: Issue[] = [
  {
    id: "iss_1",
    domainId: DEMO_ID,
    area: "seo",
    priority: "P1",
    title: "Live-Audit für startplatzboerse.com ausführen",
    description: "Technischer Audit läuft über echten HTTP-Fetch der Homepage.",
    recommendation: "Unter Audit „Audit starten“ wählen — Findings basieren auf Live-HTML.",
    status: "open",
    createdAt: daysAgo(0),
  },
  {
    id: "iss_2",
    domainId: DEMO_ID,
    area: "seo",
    priority: "P1",
    title: "Keyword-Positionen live laden",
    description: "Seed-Keywords haben noch keine SERP-Historie.",
    recommendation: "SERPAPI_KEY setzen und unter Keywords „SERP Refresh“ starten.",
    status: "open",
    createdAt: daysAgo(0),
  },
  {
    id: "iss_3",
    domainId: DEMO_ID,
    area: "geo",
    priority: "P1",
    title: "GEO-Prompts mit OpenAI prüfen",
    description: "Prompt-Bibliothek ist vorbereitet, noch ohne Live-Citation-Check.",
    recommendation: "OPENAI_API_KEY setzen und unter GEO „GEO Refresh“ starten.",
    status: "open",
    createdAt: daysAgo(0),
  },
];

export function createSeedState(): AppState {
  return {
    version: 1,
    activeDomainId: DEMO_ID,
    domains: [
      {
        id: DEMO_ID,
        hostname: "startplatzboerse.com",
        displayName: "Startplatzbörse",
        createdAt: daysAgo(0),
        isDemo: true,
      },
    ],
    healthHistory: {
      [DEMO_ID]: seriesHealthBaseline(),
    },
    audits: {
      [DEMO_ID]: null,
    },
    keywords: seedKeywords,
    contentInsights: [],
    backlinks: [],
    geoPrompts: seedGeoPrompts,
    geoSeries: {
      [DEMO_ID]: emptyGeoSeries(),
    },
    competitors: [],
    issues: seedIssues,
    settings: {
      dataDirLabel: "data/store.json",
      gscConnected: false,
      apiKeys: {},
      locale: "de",
    },
  };
}
