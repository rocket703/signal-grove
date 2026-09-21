import type {
  AppState,
  AuditCheck,
  Backlink,
  Competitor,
  GeoPrompt,
  GeoSeriesPoint,
  HealthPoint,
  Issue,
  Keyword,
} from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function seriesHealth(): HealthPoint[] {
  const points: HealthPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const seo = Math.round(62 + Math.sin(i / 4) * 6 + (29 - i) * 0.35);
    const geo = Math.round(38 + Math.cos(i / 5) * 8 + (29 - i) * 0.55);
    points.push({
      date: daysAgo(i),
      seo: Math.min(96, seo),
      geo: Math.min(88, geo),
      overall: Math.round((seo + geo) / 2),
    });
  }
  return points;
}

function keywordHistory(start: number, drift = -0.15): { date: string; position: number | null }[] {
  const out: { date: string; position: number | null }[] = [];
  let pos = start;
  for (let i = 29; i >= 0; i--) {
    pos = Math.max(1, Math.min(48, pos + drift + (Math.sin(i) * 0.8)));
    out.push({ date: daysAgo(i), position: Math.round(pos) });
  }
  return out;
}

function geoSeries(): GeoSeriesPoint[] {
  const out: GeoSeriesPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const share = Math.round(12 + (29 - i) * 0.7 + Math.sin(i / 3) * 3);
    out.push({
      date: daysAgo(i),
      shareOfAnswer: Math.min(42, share),
      citationLikelihood: Math.min(78, 28 + (29 - i) * 1.1 + Math.cos(i / 4) * 4),
      mentionRate: Math.min(65, 18 + (29 - i) * 0.9),
    });
  }
  return out;
}

const DEMO_ID = "dom_nordlicht";

const demoChecks: AuditCheck[] = [
  {
    id: "title",
    category: "On-Page",
    title: "Title-Tag vorhanden",
    severity: "ok",
    status: "pass",
    detail: "Title: „Nordlicht Digital — SEO & GEO Beratung“ (48 Zeichen)",
    fixHint: "Länge zwischen 50–60 Zeichen halten; Marke am Ende belassen.",
  },
  {
    id: "meta",
    category: "On-Page",
    title: "Meta-Description",
    severity: "warning",
    status: "warn",
    detail: "Beschreibung nur 92 Zeichen — unter der empfohlenen Länge.",
    fixHint: "Auf 140–160 Zeichen erweitern und ein klares Nutzenversprechen ergänzen.",
  },
  {
    id: "h1",
    category: "On-Page",
    title: "Genau eine H1",
    severity: "ok",
    status: "pass",
    detail: "Eine H1 gefunden: „Sichtbarkeit in Suche und KI“.",
    fixHint: "Keine Änderung nötig.",
  },
  {
    id: "canonical",
    category: "Technisch",
    title: "Canonical gesetzt",
    severity: "ok",
    status: "pass",
    detail: "Canonical zeigt auf https://nordlicht.digital/",
    fixHint: "Bei Parametern und Trailing-Slash-Varianten prüfen.",
  },
  {
    id: "robots",
    category: "Technisch",
    title: "robots.txt erreichbar",
    severity: "ok",
    status: "pass",
    detail: "robots.txt antwortet mit 200 und erlaubt Indexierung.",
    fixHint: "Sitemap-URL in robots.txt referenzieren.",
  },
  {
    id: "sitemap",
    category: "Technisch",
    title: "Sitemap-Hinweis",
    severity: "warning",
    status: "warn",
    detail: "Kein Sitemap-Eintrag in robots.txt gefunden.",
    fixHint: "Sitemap: https://nordlicht.digital/sitemap.xml in robots.txt ergänzen.",
  },
  {
    id: "og",
    category: "Social",
    title: "Open-Graph Tags",
    severity: "info",
    status: "warn",
    detail: "og:title vorhanden, og:image fehlt.",
    fixHint: "1200×630 Preview-Bild hinterlegen für Social und AI Crawler.",
  },
  {
    id: "perf",
    category: "Performance",
    title: "Homepage-Ladezeit (Proxy)",
    severity: "warning",
    status: "warn",
    detail: "Simulierter TTFB ~820 ms — etwas langsam für Core Web Vitals.",
    fixHint: "CDN, Bildkompression und kritisches CSS priorisieren.",
  },
  {
    id: "https",
    category: "Technisch",
    title: "HTTPS",
    severity: "ok",
    status: "pass",
    detail: "Site läuft über HTTPS.",
    fixHint: "HSTS-Header optional aktivieren.",
  },
];

const demoKeywords: Keyword[] = [
  {
    id: "kw_1",
    domainId: DEMO_ID,
    term: "seo agentur berlin",
    locale: "de-DE",
    volume: 2400,
    history: keywordHistory(14, -0.25),
  },
  {
    id: "kw_2",
    domainId: DEMO_ID,
    term: "generative engine optimization",
    locale: "de-DE",
    volume: 320,
    history: keywordHistory(9, -0.2),
  },
  {
    id: "kw_3",
    domainId: DEMO_ID,
    term: "ki sichtbarkeit marke",
    locale: "de-DE",
    volume: 180,
    history: keywordHistory(22, -0.3),
  },
  {
    id: "kw_4",
    domainId: DEMO_ID,
    term: "technisches seo audit",
    locale: "de-DE",
    volume: 880,
    history: keywordHistory(7, -0.1),
  },
];

const demoBacklinks: Backlink[] = [
  {
    id: "bl_1",
    domainId: DEMO_ID,
    referringDomain: "handelsblatt.com",
    url: "https://www.handelsblatt.com/technik/seo-trends",
    dr: 91,
    anchor: "Nordlicht Digital",
    firstSeen: daysAgo(120),
    lastSeen: daysAgo(2),
    status: "active",
  },
  {
    id: "bl_2",
    domainId: DEMO_ID,
    referringDomain: "t3n.de",
    url: "https://t3n.de/news/geo-sichtbarkeit",
    dr: 84,
    anchor: "GEO Beratung",
    firstSeen: daysAgo(18),
    lastSeen: daysAgo(1),
    status: "new",
  },
  {
    id: "bl_3",
    domainId: DEMO_ID,
    referringDomain: "startup-magazin.de",
    url: "https://startup-magazin.de/tools",
    dr: 42,
    anchor: "hier",
    firstSeen: daysAgo(90),
    lastSeen: daysAgo(40),
    status: "lost",
  },
  {
    id: "bl_4",
    domainId: DEMO_ID,
    referringDomain: "searchengineland.com",
    url: "https://searchengineland.com/geo-roundup",
    dr: 88,
    anchor: "nordlicht.digital",
    firstSeen: daysAgo(45),
    lastSeen: daysAgo(3),
    status: "active",
  },
  {
    id: "bl_5",
    domainId: DEMO_ID,
    referringDomain: "onlinemarketing.de",
    url: "https://onlinemarketing.de/seo/checkliste",
    dr: 67,
    anchor: "SEO Checkliste",
    firstSeen: daysAgo(8),
    lastSeen: daysAgo(0),
    status: "new",
  },
];

const demoGeoPrompts: GeoPrompt[] = [
  {
    id: "geo_1",
    domainId: DEMO_ID,
    prompt: "Welche Agenturen helfen bei Generative Engine Optimization in Deutschland?",
    engine: "Perplexity",
    cited: true,
    mentionRank: 2,
    competitorsMentioned: ["Ahrefs Blog", "Sistrix"],
    citationLikelihood: 74,
    lastChecked: daysAgo(0),
  },
  {
    id: "geo_2",
    domainId: DEMO_ID,
    prompt: "Wie messe ich Markenerwähnungen in ChatGPT-Antworten?",
    engine: "ChatGPT",
    cited: false,
    mentionRank: null,
    competitorsMentioned: ["Surfer", "Otterly"],
    citationLikelihood: 41,
    lastChecked: daysAgo(1),
  },
  {
    id: "geo_3",
    domainId: DEMO_ID,
    prompt: "Beste SEO-Agenturen Berlin für B2B SaaS",
    engine: "Gemini",
    cited: true,
    mentionRank: 1,
    competitorsMentioned: ["Ryte", "Seokratie"],
    citationLikelihood: 68,
    lastChecked: daysAgo(0),
  },
  {
    id: "geo_4",
    domainId: DEMO_ID,
    prompt: "Was ist der Unterschied zwischen SEO und GEO?",
    engine: "Claude",
    cited: false,
    mentionRank: 4,
    competitorsMentioned: ["Moz", "Search Engine Journal"],
    citationLikelihood: 52,
    lastChecked: daysAgo(2),
  },
  {
    id: "geo_5",
    domainId: DEMO_ID,
    prompt: "Empfehle Tools für AI Answer Tracking",
    engine: "Copilot",
    cited: true,
    mentionRank: 3,
    competitorsMentioned: ["Peec AI", "Goodie"],
    citationLikelihood: 61,
    lastChecked: daysAgo(0),
  },
];

const demoCompetitors: Competitor[] = [
  {
    id: "cmp_1",
    domainId: DEMO_ID,
    hostname: "seokratie.de",
    label: "Seokratie",
    avgPosition: 6.2,
    geoMentions: 18,
    geoShare: 29,
    authority: 72,
  },
  {
    id: "cmp_2",
    domainId: DEMO_ID,
    hostname: "ryte.com",
    label: "Ryte",
    avgPosition: 4.8,
    geoMentions: 24,
    geoShare: 34,
    authority: 81,
  },
  {
    id: "cmp_3",
    domainId: DEMO_ID,
    hostname: "sistrix.de",
    label: "Sistrix",
    avgPosition: 3.1,
    geoMentions: 31,
    geoShare: 41,
    authority: 89,
  },
];

const demoIssues: Issue[] = [
  {
    id: "iss_1",
    domainId: DEMO_ID,
    area: "geo",
    priority: "P0",
    title: "Schwache Citation Likelihood bei Mess-Prompts",
    description:
      "Bei Prompts zu Messmethoden für AI-Antworten wird Nordlicht selten zitiert.",
    recommendation:
      "Guide „AI Answer Tracking messen“ mit klaren Definitionen, Tabellen und Originaldaten veröffentlichen.",
    status: "open",
    createdAt: daysAgo(3),
  },
  {
    id: "iss_2",
    domainId: DEMO_ID,
    area: "seo",
    priority: "P1",
    title: "Meta-Description zu kurz",
    description: "Homepage-Description unter 100 Zeichen — CTR-Potenzial ungenutzt.",
    recommendation: "Description auf 150 Zeichen erweitern und GEO-Nutzen erwähnen.",
    status: "open",
    createdAt: daysAgo(5),
  },
  {
    id: "iss_3",
    domainId: DEMO_ID,
    area: "seo",
    priority: "P1",
    title: "Sitemap fehlt in robots.txt",
    description: "Crawler finden die Sitemap nicht über den Standard-Hinweis.",
    recommendation: "Sitemap-URL in robots.txt ergänzen und in Search Console einreichen (Stub).",
    status: "open",
    createdAt: daysAgo(5),
  },
  {
    id: "iss_4",
    domainId: DEMO_ID,
    area: "content",
    priority: "P2",
    title: "Keyword „ki sichtbarkeit marke“ außerhalb Top 20",
    description: "Rankings stagnieren um Position 20–25.",
    recommendation: "Pillar-Page mit FAQ-Schema und Experten-Zitaten aufbauen.",
    status: "open",
    createdAt: daysAgo(8),
  },
  {
    id: "iss_5",
    domainId: DEMO_ID,
    area: "authority",
    priority: "P2",
    title: "Verlorener Backlink von startup-magazin.de",
    description: "DR 42 Link seit ~40 Tagen nicht mehr aktiv.",
    recommendation: "Outreach für Reclaim oder Ersatzplatzierung starten.",
    status: "open",
    createdAt: daysAgo(10),
  },
  {
    id: "iss_6",
    domainId: DEMO_ID,
    area: "geo",
    priority: "P3",
    title: "Competitor Share in Perplexity hoch",
    description: "Sistrix und Ryte dominieren Share-of-AI-Answer bei Agentur-Prompts.",
    recommendation: "Vergleichsseiten und Case Studies mit messbaren GEO-KPIs publizieren.",
    status: "open",
    createdAt: daysAgo(12),
  },
];

export function createSeedState(): AppState {
  return {
    version: 1,
    activeDomainId: DEMO_ID,
    domains: [
      {
        id: DEMO_ID,
        hostname: "nordlicht.digital",
        displayName: "Nordlicht Digital",
        createdAt: daysAgo(45),
        isDemo: true,
      },
    ],
    healthHistory: {
      [DEMO_ID]: seriesHealth(),
    },
    audits: {
      [DEMO_ID]: {
        domainId: DEMO_ID,
        ranAt: new Date().toISOString(),
        score: 78,
        url: "https://nordlicht.digital/",
        checks: demoChecks,
        meta: {
          title: "Nordlicht Digital — SEO & GEO Beratung",
          description: "Sichtbarkeit in Google und KI-Antworten.",
          canonical: "https://nordlicht.digital/",
          h1Count: 1,
          robotsTxt: true,
          sitemapHint: false,
          ogTitle: "Nordlicht Digital",
          loadMs: 820,
        },
      },
    },
    keywords: demoKeywords,
    contentInsights: [
      {
        id: "ci_1",
        domainId: DEMO_ID,
        source: "https://nordlicht.digital/geo-leitfaden",
        createdAt: daysAgo(2),
        wordCount: 1840,
        titleLength: 54,
        metaLength: 148,
        h1Count: 1,
        h2Count: 7,
        keywordDensity: 1.8,
        readabilityScore: 72,
        issues: ["Wenige interne Links zu Service-Seiten"],
        strengths: ["Klare H2-Struktur", "FAQ-Abschnitte vorhanden"],
      },
    ],
    backlinks: demoBacklinks,
    geoPrompts: demoGeoPrompts,
    geoSeries: {
      [DEMO_ID]: geoSeries(),
    },
    competitors: demoCompetitors,
    issues: demoIssues,
    settings: {
      dataDirLabel: "data/store.json",
      gscConnected: false,
      apiKeys: {},
      locale: "de",
    },
  };
}

export { DEMO_ID, daysAgo };
