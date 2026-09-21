import { mockSerpRefresh } from "@/lib/analyzers";

export type SerpRefreshResult = {
  mode: "live" | "mock";
  history: { date: string; position: number | null }[];
  error?: string;
};

type OrganicResult = {
  position?: number;
  link?: string;
  displayed_link?: string;
};

function domainMatches(hostname: string, link?: string): boolean {
  if (!link) return false;
  try {
    const host = new URL(link.startsWith("http") ? link : `https://${link}`).hostname
      .replace(/^www\./, "")
      .toLowerCase();
    const target = hostname.replace(/^www\./, "").toLowerCase();
    return host === target || host.endsWith(`.${target}`);
  } catch {
    return link.toLowerCase().includes(hostname.replace(/^www\./, "").toLowerCase());
  }
}

export async function refreshKeywordPosition(opts: {
  apiKey?: string;
  term: string;
  hostname: string;
  locale?: string;
  history: { date: string; position: number | null }[];
}): Promise<SerpRefreshResult> {
  if (!opts.apiKey) {
    return { mode: "mock", history: mockSerpRefresh(opts.history) };
  }

  const locale = opts.locale || "de-DE";
  const [lang, country] = locale.split("-");
  const params = new URLSearchParams({
    engine: "google",
    q: opts.term,
    api_key: opts.apiKey,
    hl: (lang || "de").toLowerCase(),
    gl: (country || "de").toLowerCase(),
    num: "100",
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        mode: "mock",
        history: mockSerpRefresh(opts.history),
        error: `SerpAPI HTTP ${res.status}: ${text.slice(0, 160)}`,
      };
    }
    const data = (await res.json()) as {
      organic_results?: OrganicResult[];
      error?: string;
    };
    if (data.error) {
      return {
        mode: "mock",
        history: mockSerpRefresh(opts.history),
        error: data.error,
      };
    }

    const organic = data.organic_results || [];
    let position: number | null = null;
    for (const row of organic) {
      if (domainMatches(opts.hostname, row.link) || domainMatches(opts.hostname, row.displayed_link)) {
        position = row.position ?? null;
        break;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const withoutToday = opts.history.filter((h) => h.date !== today);
    return {
      mode: "live",
      history: [...withoutToday, { date: today, position }].slice(-60),
    };
  } catch (e) {
    return {
      mode: "mock",
      history: mockSerpRefresh(opts.history),
      error: e instanceof Error ? e.message : "SerpAPI Fehler",
    };
  }
}
