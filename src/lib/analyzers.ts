import type { AuditCheck, AuditResult, ContentInsight } from "./types";
import { uid } from "./store";

function extractTag(html: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m?.[1]?.replace(/<[^>]+>/g, "").trim();
}

function metaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return (m?.[1] || m?.[2])?.trim();
}

function countTags(html: string, tag: string): number {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) || []).length;
}

export async function runHomepageAudit(
  domainId: string,
  hostname: string
): Promise<AuditResult> {
  const url = `https://${hostname.replace(/^https?:\/\//, "").replace(/\/$/, "")}/`;
  const checks: AuditCheck[] = [];
  let html = "";
  let loadMs: number | undefined;
  let fetched = false;

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SeoGeoTracker/1.0 (+local)" },
      redirect: "follow",
    });
    clearTimeout(timer);
    loadMs = Date.now() - start;
    if (res.ok) {
      html = await res.text();
      fetched = true;
    }
  } catch {
    fetched = false;
  }

  if (!fetched) {
    // Offline / blocked: generate a plausible simulated audit
    checks.push(
      {
        id: "fetch",
        category: "Technisch",
        title: "Homepage erreichbar",
        severity: "warning",
        status: "warn",
        detail: `Live-Fetch von ${url} nicht möglich — Simulierter Audit aktiv.`,
        fixHint:
          "Netzwerkzugriff prüfen oder Demo-Modus nutzen. Später: eigener Crawler-Connector.",
      },
      {
        id: "title",
        category: "On-Page",
        title: "Title-Tag",
        severity: "info",
        status: "skip",
        detail: "Kein HTML geladen — Check übersprungen.",
        fixHint: "Nach erfolgreichem Fetch erneut prüfen.",
      },
      {
        id: "https",
        category: "Technisch",
        title: "HTTPS angenommen",
        severity: "ok",
        status: "pass",
        detail: "URL verwendet https:// Schema.",
        fixHint: "Zertifikat und Redirects manuell verifizieren.",
      }
    );
    return {
      domainId,
      ranAt: new Date().toISOString(),
      score: 55,
      url,
      checks,
      meta: { h1Count: 0, robotsTxt: false, sitemapHint: false, loadMs },
    };
  }

  const title = extractTag(html, "title");
  const description = metaContent(html, "description");
  const canonical =
    html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1];
  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");
  const h1Count = countTags(html, "h1");

  let robotsTxt = false;
  let sitemapHint = false;
  try {
    const robotsRes = await fetch(new URL("/robots.txt", url).toString(), {
      signal: AbortSignal.timeout(5000),
    });
    if (robotsRes.ok) {
      robotsTxt = true;
      const body = await robotsRes.text();
      sitemapHint = /sitemap:/i.test(body);
    }
  } catch {
    robotsTxt = false;
  }

  checks.push({
    id: "title",
    category: "On-Page",
    title: "Title-Tag",
    severity: title ? (title.length >= 30 && title.length <= 65 ? "ok" : "warning") : "critical",
    status: title ? (title.length >= 30 && title.length <= 65 ? "pass" : "warn") : "fail",
    detail: title ? `„${title}“ (${title.length} Zeichen)` : "Kein Title gefunden.",
    fixHint: "Title 50–60 Zeichen, Primärkeyword vorne, Marke hinten.",
  });

  checks.push({
    id: "meta",
    category: "On-Page",
    title: "Meta-Description",
    severity: description
      ? description.length >= 120 && description.length <= 165
        ? "ok"
        : "warning"
      : "critical",
    status: description
      ? description.length >= 120 && description.length <= 165
        ? "pass"
        : "warn"
      : "fail",
    detail: description
      ? `${description.length} Zeichen`
      : "Keine Meta-Description.",
    fixHint: "140–160 Zeichen mit klarem CTA und Nutzenversprechen.",
  });

  checks.push({
    id: "h1",
    category: "On-Page",
    title: "H1-Struktur",
    severity: h1Count === 1 ? "ok" : "warning",
    status: h1Count === 1 ? "pass" : "warn",
    detail: `${h1Count} H1-Tag(s) gefunden.`,
    fixHint: "Genau eine H1 pro Seite verwenden.",
  });

  checks.push({
    id: "canonical",
    category: "Technisch",
    title: "Canonical",
    severity: canonical ? "ok" : "warning",
    status: canonical ? "pass" : "warn",
    detail: canonical || "Kein Canonical-Link.",
    fixHint: "Self-referencing Canonical auf der Homepage setzen.",
  });

  checks.push({
    id: "robots",
    category: "Technisch",
    title: "robots.txt",
    severity: robotsTxt ? "ok" : "warning",
    status: robotsTxt ? "pass" : "warn",
    detail: robotsTxt ? "robots.txt erreichbar." : "robots.txt nicht erreichbar.",
    fixHint: "robots.txt bereitstellen und Crawl-Regeln klar halten.",
  });

  checks.push({
    id: "sitemap",
    category: "Technisch",
    title: "Sitemap in robots.txt",
    severity: sitemapHint ? "ok" : "warning",
    status: sitemapHint ? "pass" : "warn",
    detail: sitemapHint
      ? "Sitemap-Hinweis gefunden."
      : "Kein Sitemap-Eintrag in robots.txt.",
    fixHint: "Sitemap: https://example.com/sitemap.xml ergänzen.",
  });

  checks.push({
    id: "og",
    category: "Social",
    title: "Open Graph",
    severity: ogTitle && ogImage ? "ok" : "info",
    status: ogTitle && ogImage ? "pass" : "warn",
    detail: `og:title ${ogTitle ? "ok" : "fehlt"}, og:image ${ogImage ? "ok" : "fehlt"}`,
    fixHint: "og:title und og:image (1200×630) setzen.",
  });

  checks.push({
    id: "perf",
    category: "Performance",
    title: "Ladezeit-Proxy",
    severity: !loadMs ? "info" : loadMs < 600 ? "ok" : loadMs < 1200 ? "warning" : "critical",
    status: !loadMs ? "skip" : loadMs < 600 ? "pass" : "warn",
    detail: loadMs ? `Antwort in ~${loadMs} ms` : "Nicht gemessen",
    fixHint: "TTFB senken; später PageSpeed API (PAGESPEED_API_KEY) anbinden.",
  });

  const scoreWeights: Record<string, number> = {
    pass: 100,
    warn: 55,
    fail: 15,
    skip: 50,
  };
  const score = Math.round(
    checks.reduce((sum, c) => sum + scoreWeights[c.status], 0) / checks.length
  );

  return {
    domainId,
    ranAt: new Date().toISOString(),
    score,
    url,
    checks,
    meta: {
      title,
      description,
      canonical,
      h1Count,
      robotsTxt,
      sitemapHint,
      ogTitle,
      loadMs,
    },
  };
}

export function analyzeContent(
  domainId: string,
  source: string,
  text: string
): ContentInsight {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentence =
    sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const longWords = words.filter((w) => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, "").length > 6)
    .length;
  const readability = Math.max(
    20,
    Math.min(
      95,
      Math.round(100 - avgSentence * 1.8 - (longWords / Math.max(1, wordCount)) * 40)
    )
  );

  const titleMatch = text.match(/^#\s+(.+)$/m) || text.match(/title[:\s]+(.+)/i);
  const title = titleMatch?.[1]?.trim() || source.slice(0, 60);
  const h1Count = (text.match(/^#\s+/gm) || []).length || (/"h1"/gi.test(text) ? 1 : 0);
  const h2Count = (text.match(/^##\s+/gm) || []).length;
  const keyword = words[0]?.toLowerCase() || "";
  const density =
    wordCount > 0
      ? Math.round(
          ((words.filter((w) => w.toLowerCase().includes(keyword.slice(0, 5))).length /
            wordCount) *
            100 +
            Number.EPSILON) *
            10
        ) / 10
      : 0;

  const issues: string[] = [];
  const strengths: string[] = [];
  if (wordCount < 300) issues.push("Inhalt unter 300 Wörtern — für Ranking oft zu dünn.");
  else strengths.push("Ausreichende Textlänge für thematische Tiefe.");
  if (title.length < 30 || title.length > 65)
    issues.push("Titel-Länge außerhalb des SEO-Sweet-Spots (30–65).");
  else strengths.push("Titel-Länge wirkt ausgewogen.");
  if (readability < 55) issues.push("Lesbarkeit eher schwer — Sätze kürzen.");
  else strengths.push("Lesbarkeit im guten Bereich.");
  if (h2Count < 2) issues.push("Wenige Zwischenüberschriften — Struktur stärken.");
  else strengths.push("Gute Zwischenüberschriften-Struktur.");

  return {
    id: uid("ci"),
    domainId,
    source,
    createdAt: new Date().toISOString(),
    wordCount,
    titleLength: title.length,
    metaLength: Math.min(160, Math.round(wordCount / 8)),
    h1Count: Math.max(h1Count, 1),
    h2Count,
    keywordDensity: density,
    readabilityScore: readability,
    issues,
    strengths,
  };
}

export function mockSerpRefresh(
  history: { date: string; position: number | null }[]
): { date: string; position: number | null }[] {
  const last = history[history.length - 1]?.position ?? 20;
  const delta = Math.round((Math.random() - 0.45) * 4);
  const nextPos = Math.max(1, Math.min(50, last + delta));
  const today = new Date().toISOString().slice(0, 10);
  const withoutToday = history.filter((h) => h.date !== today);
  return [...withoutToday, { date: today, position: nextPos }].slice(-60);
}

export function mockGeoRefresh(prompt: {
  citationLikelihood: number;
  cited: boolean;
  mentionRank: number | null;
  competitorsMentioned: string[];
}) {
  const likelihood = Math.max(
    15,
    Math.min(95, Math.round(prompt.citationLikelihood + (Math.random() - 0.4) * 12))
  );
  const cited = likelihood > 55 ? true : Math.random() > 0.55;
  return {
    citationLikelihood: likelihood,
    cited,
    mentionRank: cited ? Math.max(1, Math.min(5, (prompt.mentionRank ?? 3) + Math.round((Math.random() - 0.5) * 2))) : null,
    lastChecked: new Date().toISOString().slice(0, 10),
  };
}
