import type { AppState } from "@/lib/types";

export type ResolvedKeys = {
  serpapi?: string;
  openai?: string;
  pagespeed?: string;
  sources: {
    serpapi: "env" | "settings" | "none";
    openai: "env" | "settings" | "none";
    pagespeed: "env" | "settings" | "none";
  };
};

function pick(
  envName: string,
  settingsValue?: string
): { value?: string; source: "env" | "settings" | "none" } {
  const env = process.env[envName]?.trim();
  if (env) return { value: env, source: "env" };
  const settings = settingsValue?.trim();
  if (settings && !settings.startsWith("env:")) {
    return { value: settings, source: "settings" };
  }
  return { source: "none" };
}

export function resolveApiKeys(state?: AppState | null): ResolvedKeys {
  const serp = pick("SERPAPI_KEY", state?.settings.apiKeys.serpapi);
  const openai = pick("OPENAI_API_KEY", state?.settings.apiKeys.openai);
  const pagespeed = pick("PAGESPEED_API_KEY", state?.settings.apiKeys.pagespeed);
  return {
    serpapi: serp.value,
    openai: openai.value,
    pagespeed: pagespeed.value,
    sources: {
      serpapi: serp.source,
      openai: openai.source,
      pagespeed: pagespeed.source,
    },
  };
}

export type ConnectorStatus = {
  audit: { mode: "live"; detail: string };
  content: { mode: "live"; detail: string };
  serp: { mode: "live" | "offline"; detail: string; source: string };
  geo: { mode: "live" | "offline"; detail: string; source: string };
  pagespeed: { mode: "live" | "offline"; detail: string; source: string };
  backlinks: { mode: "manual"; detail: string };
  anyLiveProvider: boolean;
};

export function buildConnectorStatus(state?: AppState | null): ConnectorStatus {
  const keys = resolveApiKeys(state);
  return {
    audit: {
      mode: "live",
      detail: "HTTP-Fetch der Domain (Title, Meta, robots, Canonical, OG).",
    },
    content: {
      mode: "live",
      detail: "Lokale Analyse von Paste oder Live-Fetch einer URL.",
    },
    serp: keys.serpapi
      ? {
          mode: "live",
          detail: "SerpAPI Google Organic — echte Positionen.",
          source: keys.sources.serpapi,
        }
      : {
          mode: "offline",
          detail: "Kein SERPAPI_KEY — SERP-Refresh ist Demo/Mock und so gekennzeichnet.",
          source: "none",
        },
    geo: keys.openai
      ? {
          mode: "live",
          detail: "OpenAI-kompatibel — Prompt-Antworten auf Markenerwähnungen geprüft.",
          source: keys.sources.openai,
        }
      : {
          mode: "offline",
          detail: "Kein OPENAI_API_KEY — GEO-Refresh ist Demo/Mock und so gekennzeichnet.",
          source: "none",
        },
    pagespeed: keys.pagespeed
      ? {
          mode: "live",
          detail: "PageSpeed Insights API für Performance-Checks.",
          source: keys.sources.pagespeed,
        }
      : {
          mode: "offline",
          detail: "Kein PAGESPEED_API_KEY — Audit nutzt Fetch-TTFB als Proxy.",
          source: "none",
        },
    backlinks: {
      mode: "manual",
      detail: "Kein kostenloser Live-Backlink-Provider — JSON-Import / manuell.",
    },
    anyLiveProvider: Boolean(keys.serpapi || keys.openai || keys.pagespeed),
  };
}
