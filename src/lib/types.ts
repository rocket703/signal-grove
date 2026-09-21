export type Severity = "critical" | "warning" | "info" | "ok";

export type Domain = {
  id: string;
  hostname: string;
  displayName: string;
  createdAt: string;
  isDemo?: boolean;
};

export type HealthPoint = {
  date: string;
  seo: number;
  geo: number;
  overall: number;
};

export type AuditCheck = {
  id: string;
  category: string;
  title: string;
  severity: Severity;
  status: "pass" | "fail" | "warn" | "skip";
  detail: string;
  fixHint: string;
};

export type AuditResult = {
  domainId: string;
  ranAt: string;
  score: number;
  url: string;
  checks: AuditCheck[];
  meta: {
    title?: string;
    description?: string;
    canonical?: string;
    h1Count: number;
    robotsTxt: boolean;
    sitemapHint: boolean;
    ogTitle?: string;
    loadMs?: number;
  };
};

export type KeywordHistoryPoint = {
  date: string;
  position: number | null;
};

export type Keyword = {
  id: string;
  domainId: string;
  term: string;
  locale: string;
  volume?: number;
  history: KeywordHistoryPoint[];
};

export type ContentInsight = {
  id: string;
  domainId: string;
  source: string;
  createdAt: string;
  wordCount: number;
  titleLength: number;
  metaLength: number;
  h1Count: number;
  h2Count: number;
  keywordDensity: number;
  readabilityScore: number;
  issues: string[];
  strengths: string[];
};

export type Backlink = {
  id: string;
  domainId: string;
  referringDomain: string;
  url: string;
  dr: number;
  anchor: string;
  firstSeen: string;
  lastSeen: string;
  status: "active" | "new" | "lost";
};

export type GeoPrompt = {
  id: string;
  domainId: string;
  prompt: string;
  engine: "ChatGPT" | "Perplexity" | "Gemini" | "Claude" | "Copilot";
  cited: boolean;
  mentionRank: number | null;
  competitorsMentioned: string[];
  citationLikelihood: number;
  lastChecked: string;
};

export type GeoSeriesPoint = {
  date: string;
  shareOfAnswer: number;
  citationLikelihood: number;
  mentionRate: number;
};

export type Competitor = {
  id: string;
  domainId: string;
  hostname: string;
  label: string;
  avgPosition: number;
  geoMentions: number;
  geoShare: number;
  authority: number;
};

export type Issue = {
  id: string;
  domainId: string;
  area: "seo" | "geo" | "content" | "authority";
  priority: "P0" | "P1" | "P2" | "P3";
  title: string;
  description: string;
  recommendation: string;
  status: "open" | "done" | "dismissed";
  createdAt: string;
};

export type AppSettings = {
  dataDirLabel: string;
  gscConnected: boolean;
  apiKeys: {
    serpapi?: string;
    openai?: string;
    pagespeed?: string;
  };
  locale: "de" | "en";
};

export type AppState = {
  version: 1;
  activeDomainId: string | null;
  domains: Domain[];
  healthHistory: Record<string, HealthPoint[]>;
  audits: Record<string, AuditResult | null>;
  keywords: Keyword[];
  contentInsights: ContentInsight[];
  backlinks: Backlink[];
  geoPrompts: GeoPrompt[];
  geoSeries: Record<string, GeoSeriesPoint[]>;
  competitors: Competitor[];
  issues: Issue[];
  settings: AppSettings;
};
