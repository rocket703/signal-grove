export async function fetchPageSpeedScore(opts: {
  apiKey: string;
  url: string;
}): Promise<{ score: number | null; detail: string } | null> {
  try {
    const params = new URLSearchParams({
      url: opts.url,
      key: opts.apiKey,
      strategy: "mobile",
      category: "performance",
    });
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: AbortSignal.timeout(30000) }
    );
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number } };
      };
    };
    const score01 = data.lighthouseResult?.categories?.performance?.score;
    if (score01 == null) return null;
    const score = Math.round(score01 * 100);
    return {
      score,
      detail: `PageSpeed Performance Score: ${score}/100 (mobile)`,
    };
  } catch {
    return null;
  }
}
