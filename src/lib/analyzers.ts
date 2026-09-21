import type { AuditCheck, AuditResult, ContentInsight } from "./types";
import { fetchPageSpeedScore } from "./connectors/pagespeed";
import { uid } from "./store";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTag(html: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m?.[1] ? decodeEntities(m[1].replace(/<[^>]+>/g, "").trim()) : undefined;
}

function metaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  const raw = m?.[1] || m?.[2];
  return raw ? decodeEntities(raw.trim()) : undefined;
}

function countTags(html: string, tag: string): number {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) || []).length;
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export async function fetchHtml(url: string): Promise<{
  ok: boolean;
  html: string;
  loadMs?: number;
  status?: number;
  error?: string;
  finalUrl?: string;
}> {
  try {
    const start = Date.now();
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent":
          "SignalGroveBot/1.0 (+https://github.com; SEO audit; contact local operator)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const loadMs = Date.now() - start;
    const html = await res.text();
    return {
      ok: res.ok,
      html,
      loadMs,
      status: res.status,
      finalUrl: res.url,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      html: "",
      error: e instanceof Error ? e.message : "Fetch fehlgeschlagen",
    };
  }
}

export async function runHomepageAudit(
  domainId: string,
  hostname: string,
  pagespeedKey?: string
): Promise<AuditResult> {
  const url = `https://${hostname.replace(/^https?:\/\//, "").replace(/\/$/, "")}/`;
  const checks: AuditCheck[] = [];
  const fetched = await fetchHtml(url);

  if (!fetched.ok) {
    checks.push({
      id: "fetch",
      category: "Technisch",
      title: "Homepage erreichbar",
      severity: "critical",
      status: "fail",
      detail: `Live-Fetch von ${url} fehlgeschlagen: ${fetched.error || "unbekannt"}. Kein Simuliertes Ergebnis.`,
      fixHint: "DNS, HTTPS und Firewall prüfen; Audit erneut starten.",
    });
    return {
      domainId,
      ranAt: new Date().toISOString(),
      score: 10,
      url,
      checks,
      meta: {
        h1Count: 0,
        robotsTxt: false,
        sitemapHint: false,
        loadMs: fetched.loadMs,
      },
    };
  }

  const html = fetched.html;
  const loadMs = fetched.loadMs;
  const title = extractTag(html, "title");
  const description = metaContent(html, "description");
  const canonical =
    html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1];
  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");
  const h1Count = countTags(html, "h1");

  checks.push({
    id: "fetch",
    category: "Technisch",
    title: "Live-Fetch",
    severity: "ok",
    status: "pass",
    detail: `HTML geladen (${html.length} Bytes${loadMs ? `, ${loadMs} ms` : ""}) von ${fetched.finalUrl || url}`,
    fixHint: "Keine Änderung nötig.",
  });

  let robotsTxt = false;
  let sitemapHint = false;
  try {
    const robotsRes = await fetch(new URL("/robots.txt", url).toString(), {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "SignalGroveBot/1.0" },
    });
    if (robotsRes.ok) {
      robotsTxt = true;
      const body = await robotsRes.text();
      sitemapHint = /sitemap:\s*\S+/i.test(body);
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
      ? `„${description.slice(0, 120)}${description.length > 120 ? "…" : ""}“ (${description.length} Zeichen)`
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
    fixHint: `Sitemap: https://${hostname}/sitemap.xml in robots.txt ergänzen.`,
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

  if (pagespeedKey) {
    const psi = await fetchPageSpeedScore({ apiKey: pagespeedKey, url });
    if (psi?.score != null) {
      const score = psi.score;
      checks.push({
        id: "perf",
        category: "Performance",
        title: "PageSpeed Insights",
        severity: score >= 90 ? "ok" : score >= 50 ? "warning" : "critical",
        status: score >= 90 ? "pass" : "warn",
        detail: psi.detail,
        fixHint: "Core Web Vitals und LCP/INP verbessern.",
      });
    } else {
      checks.push({
        id: "perf",
        category: "Performance",
        title: "Ladezeit-Proxy (Fetch)",
        severity: !loadMs ? "info" : loadMs < 600 ? "ok" : loadMs < 1200 ? "warning" : "critical",
        status: !loadMs ? "skip" : loadMs < 600 ? "pass" : "warn",
        detail: `PageSpeed API fehlgeschlagen — Fetch-TTFB ~${loadMs ?? "?"} ms`,
        fixHint: "PAGESPEED_API_KEY und Quota prüfen.",
      });
    }
  } else {
    checks.push({
      id: "perf",
      category: "Performance",
      title: "Ladezeit-Proxy (Fetch)",
      severity: !loadMs ? "info" : loadMs < 600 ? "ok" : loadMs < 1200 ? "warning" : "critical",
      status: !loadMs ? "skip" : loadMs < 600 ? "pass" : "warn",
      detail: loadMs ? `Server-Antwort in ~${loadMs} ms (kein PageSpeed-Key)` : "Nicht gemessen",
      fixHint: "Optional PAGESPEED_API_KEY setzen für Lighthouse-Score.",
    });
  }

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

export async function analyzeContentInput(
  domainId: string,
  source: string,
  text: string
): Promise<ContentInsight> {
  let body = text.trim();
  let resolvedSource = source.trim() || "paste";

  const looksLikeUrl = /^https?:\/\//i.test(resolvedSource) || /^https?:\/\//i.test(body);
  if (!body && /^https?:\/\//i.test(resolvedSource)) {
    const fetched = await fetchHtml(resolvedSource);
    if (!fetched.ok) {
      return {
        id: uid("ci"),
        domainId,
        source: resolvedSource,
        createdAt: new Date().toISOString(),
        wordCount: 0,
        titleLength: 0,
        metaLength: 0,
        h1Count: 0,
        h2Count: 0,
        keywordDensity: 0,
        readabilityScore: 0,
        issues: [`Live-Fetch fehlgeschlagen: ${fetched.error || "unbekannt"}`],
        strengths: [],
      };
    }
    const title = extractTag(fetched.html, "title") || resolvedSource;
    body = `${title}\n\n${htmlToText(fetched.html)}`;
  } else if (looksLikeUrl && /^https?:\/\//i.test(body) && body.split(/\s+/).length <= 2) {
    resolvedSource = body;
    const fetched = await fetchHtml(body);
    if (fetched.ok) {
      const title = extractTag(fetched.html, "title") || body;
      body = `${title}\n\n${htmlToText(fetched.html)}`;
    }
  }

  return analyzeContent(domainId, resolvedSource, body);
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

  const titleMatch = text.match(/^#\s+(.+)$/m) || text.match(/^(.+)$/m);
  const title = titleMatch?.[1]?.trim().slice(0, 80) || source.slice(0, 60);
  const h1Count = (text.match(/^#\s+/gm) || []).length;
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
  if (h2Count < 2 && wordCount > 400)
    issues.push("Wenige Zwischenüberschriften — Struktur stärken.");
  else if (h2Count >= 2) strengths.push("Gute Zwischenüberschriften-Struktur.");

  return {
    id: uid("ci"),
    domainId,
    source,
    createdAt: new Date().toISOString(),
    wordCount,
    titleLength: title.length,
    metaLength: Math.min(160, Math.round(wordCount / 8)),
    h1Count: Math.max(h1Count, title ? 1 : 0),
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
    mentionRank: cited
      ? Math.max(
          1,
          Math.min(5, (prompt.mentionRank ?? 3) + Math.round((Math.random() - 0.5) * 2))
        )
      : null,
    lastChecked: new Date().toISOString().slice(0, 10),
  };
}
