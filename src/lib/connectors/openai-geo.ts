import { mockGeoRefresh } from "@/lib/analyzers";
import type { GeoPrompt } from "@/lib/types";

export type GeoRefreshResult = {
  mode: "live" | "mock";
  update: Partial<GeoPrompt>;
  error?: string;
};

const OPENAI_BASE = process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function refreshGeoPrompt(opts: {
  apiKey?: string;
  prompt: GeoPrompt;
  brandName: string;
  hostname: string;
}): Promise<GeoRefreshResult> {
  if (!opts.apiKey) {
    return { mode: "mock", update: mockGeoRefresh(opts.prompt) };
  }

  const system = `Du bist ein GEO/AI-Visibility-Analyzer. Antworte NUR mit gültigem JSON (kein Markdown).
Schema:
{
  "answerExcerpt": string,
  "cited": boolean,
  "mentionRank": number|null,
  "citationLikelihood": number,
  "competitorsMentioned": string[]
}
Regeln:
- Beantworte die User-Frage kurz wie ein Assistent (Fakten, Marken, Quellen).
- cited=true wenn brandName oder hostname in der Antwort vorkommen.
- mentionRank = 1-basierte Reihenfolge unter genannten Marken/Domains (null wenn nicht erwähnt).
- citationLikelihood 0-100: Wahrscheinlichkeit, dass diese Marke in realen AI-Antworten zitiert/erwähnt wird (basierend auf deiner Antwort und Bekanntheit).
- competitorsMentioned: andere Marken/Domains in der Antwort (ohne die Zielmarke).`;

  const user = `Marke: ${opts.brandName}
Domain: ${opts.hostname}
Engine-Kontext: ${opts.prompt.engine}
Frage: ${opts.prompt.prompt}`;

  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        mode: "mock",
        update: mockGeoRefresh(opts.prompt),
        error: `OpenAI HTTP ${res.status}: ${text.slice(0, 180)}`,
      };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as {
      cited?: boolean;
      mentionRank?: number | null;
      citationLikelihood?: number;
      competitorsMentioned?: string[];
    };

    const likelihood = Math.max(
      0,
      Math.min(100, Math.round(Number(parsed.citationLikelihood ?? 40)))
    );
    const cited = Boolean(parsed.cited);
    const mentionRank =
      cited && parsed.mentionRank != null
        ? Math.max(1, Math.min(10, Math.round(Number(parsed.mentionRank))))
        : cited
          ? 1
          : null;

    return {
      mode: "live",
      update: {
        cited,
        mentionRank,
        citationLikelihood: likelihood,
        competitorsMentioned: Array.isArray(parsed.competitorsMentioned)
          ? parsed.competitorsMentioned.map(String).slice(0, 8)
          : [],
        lastChecked: new Date().toISOString().slice(0, 10),
        engine: "ChatGPT",
      },
    };
  } catch (e) {
    return {
      mode: "mock",
      update: mockGeoRefresh(opts.prompt),
      error: e instanceof Error ? e.message : "OpenAI Fehler",
    };
  }
}
