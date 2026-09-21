import type { APIRoute } from "astro";
import { analyzeContentInput, runHomepageAudit } from "@/lib/analyzers";
import { resolveApiKeys } from "@/lib/connectors/keys";
import { refreshGeoPrompt, type GeoRefreshResult } from "@/lib/connectors/openai-geo";
import { refreshKeywordPosition } from "@/lib/connectors/serp";
import { daysAgo } from "@/lib/seed";
import { emptyDomainBundle, formatHost } from "@/lib/selectors";
import { STARTPLATZ_KEYWORDS } from "@/lib/startplatz-keywords";
import { readState, resetDemoData, uid, updateState, writeState } from "@/lib/store";
import type { AppState, Competitor, Keyword } from "@/lib/types";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}



export const GET: APIRoute = async () => {
  const state = await readState();
  return jsonResponse(state);
}

export const PUT: APIRoute = async ({ request }) => {
  const body = (await request.json()) as AppState;
  const saved = await writeState(body);
  return jsonResponse(saved);
}

function actionError(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

type ActionBody =
  | { action: "addDomain"; hostname: string; displayName?: string }
  | { action: "setActive"; domainId: string }
  | { action: "removeDomain"; domainId: string }
  | { action: "runAudit"; domainId: string }
  | { action: "addKeyword"; domainId: string; term: string; locale?: string }
  | { action: "seedKeywords"; domainId: string; terms?: string[] }
  | { action: "refreshKeywords"; domainId: string }
  | { action: "analyzeContent"; domainId: string; source: string; text: string }
  | { action: "importBacklinks"; domainId: string; items: unknown[] }
  | { action: "addGeoPrompt"; domainId: string; prompt: string; engine?: string }
  | { action: "refreshGeo"; domainId: string }
  | { action: "addCompetitor"; domainId: string; hostname: string; label?: string }
  | { action: "removeCompetitor"; competitorId: string }
  | { action: "updateIssue"; issueId: string; status: "open" | "done" | "dismissed" }
  | { action: "updateSettings"; settings: Partial<AppState["settings"]> }
  | { action: "resetDemo" };

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as ActionBody;

    switch (body.action) {
      case "addDomain": {
        const hostname = formatHost(body.hostname);
        if (!hostname || !hostname.includes(".")) {
          return actionError("Ungültige Domain");
        }
        const current = await readState();
        if (current.domains.some((d) => d.hostname === hostname)) {
          return actionError("Domain existiert bereits");
        }
        const state = await updateState((s) => {
          const id = uid("dom");
          const bundle = emptyDomainBundle();
          s.domains.push({
            id,
            hostname,
            displayName: body.displayName?.trim() || hostname,
            createdAt: new Date().toISOString(),
          });
          s.activeDomainId = id;
          s.healthHistory[id] = bundle.health;
          s.geoSeries[id] = bundle.geoSeries;
          s.audits[id] = null;
          const starter: Keyword = {
            id: uid("kw"),
            domainId: id,
            term: hostname.split(".")[0] || "marke",
            locale: "de-DE",
            volume: undefined,
            history: [],
          };
          s.keywords.push(starter);
          s.issues.push({
            id: uid("iss"),
            domainId: id,
            area: "seo",
            priority: "P1",
            title: "Ersten technischen Audit ausführen",
            description: "Für die neue Domain liegt noch kein frischer Live-Audit vor.",
            recommendation: "Im Bereich Audit „Audit starten“ wählen (HTTP-Fetch).",
            status: "open",
            createdAt: new Date().toISOString(),
          });
          s.issues.push({
            id: uid("iss"),
            domainId: id,
            area: "geo",
            priority: "P1",
            title: "GEO-Prompt-Bibliothek anlegen",
            description: "Noch keine AI-Visibility-Prompts für diese Domain.",
            recommendation: "3–5 typische Buyer-Prompts unter GEO hinzufügen.",
            status: "open",
            createdAt: new Date().toISOString(),
          });
        });
        return jsonResponse(state);
      }

      case "setActive": {
        const current = await readState();
        if (!current.domains.some((d) => d.id === body.domainId)) {
          return actionError("Domain nicht gefunden", 404);
        }
        const state = await updateState((s) => {
          s.activeDomainId = body.domainId;
        });
        return jsonResponse(state);
      }

      case "removeDomain": {
        const state = await updateState((s) => {
          s.domains = s.domains.filter((d) => d.id !== body.domainId);
          delete s.healthHistory[body.domainId];
          delete s.audits[body.domainId];
          delete s.geoSeries[body.domainId];
          s.keywords = s.keywords.filter((k) => k.domainId !== body.domainId);
          s.contentInsights = s.contentInsights.filter((c) => c.domainId !== body.domainId);
          s.backlinks = s.backlinks.filter((b) => b.domainId !== body.domainId);
          s.geoPrompts = s.geoPrompts.filter((g) => g.domainId !== body.domainId);
          s.competitors = s.competitors.filter((c) => c.domainId !== body.domainId);
          s.issues = s.issues.filter((i) => i.domainId !== body.domainId);
          if (s.activeDomainId === body.domainId) {
            s.activeDomainId = s.domains[0]?.id ?? null;
          }
        });
        return jsonResponse(state);
      }

      case "runAudit": {
        const current = await readState();
        const domain = current.domains.find((d) => d.id === body.domainId);
        if (!domain) {
          return actionError("Domain nicht gefunden", 404);
        }
        const keys = resolveApiKeys(current);
        const audit = await runHomepageAudit(domain.id, domain.hostname, keys.pagespeed);
        const state = await updateState((s) => {
          s.audits[domain.id] = audit;
          const hist = s.healthHistory[domain.id] ?? [];
          const today = new Date().toISOString().slice(0, 10);
          const lastGeo = hist[hist.length - 1]?.geo ?? 40;
          const point = {
            date: today,
            seo: audit.score,
            geo: lastGeo,
            overall: Math.round((audit.score + lastGeo) / 2),
          };
          s.healthHistory[domain.id] = [...hist.filter((h) => h.date !== today), point].slice(
            -60
          );
        });
        return jsonResponse({
          ...state,
          _meta: {
            mode: "live",
            note: `Audit via HTTP-Fetch${keys.pagespeed ? " + PageSpeed" : ""}.`,
          },
        });
      }

      case "addKeyword": {
        const term = body.term.trim().toLowerCase();
        if (!term) {
          return actionError("Keyword fehlt");
        }
        const state = await updateState((s) => {
          const exists = s.keywords.some(
            (k) => k.domainId === body.domainId && k.term === term
          );
          if (!exists) {
            s.keywords.push({
              id: uid("kw"),
              domainId: body.domainId,
              term,
              locale: body.locale || "de-DE",
              history: [],
            });
          }
        });
        return jsonResponse(state);
      }

      case "seedKeywords": {
        const terms = (body.terms?.length ? body.terms : STARTPLATZ_KEYWORDS)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        let added = 0;
        const state = await updateState((s) => {
          const existing = new Set(
            s.keywords
              .filter((k) => k.domainId === body.domainId)
              .map((k) => k.term.toLowerCase())
          );
          for (const term of terms) {
            if (existing.has(term)) continue;
            s.keywords.push({
              id: uid("kw"),
              domainId: body.domainId,
              term,
              locale: "de-DE",
              history: [],
            });
            existing.add(term);
            added++;
          }
        });
        return jsonResponse({
          ...state,
          _meta: {
            mode: "live",
            note: `${added} Keywords hinzugefügt (${terms.length} in Liste).`,
            added,
            total: terms.length,
          },
        });
      }

      case "refreshKeywords": {
        const current = await readState();
        const domain = current.domains.find((d) => d.id === body.domainId);
        if (!domain) return actionError("Domain nicht gefunden", 404);
        const keys = resolveApiKeys(current);
        const targets = current.keywords.filter((k) => k.domainId === body.domainId);
        const results = await Promise.all(
          targets.map((k) =>
            refreshKeywordPosition({
              apiKey: keys.serpapi,
              term: k.term,
              hostname: domain.hostname,
              locale: k.locale,
              history: k.history,
            })
          )
        );
        const modes = new Set(results.map((r) => r.mode));
        const errors = results.map((r) => r.error).filter(Boolean);
        const byId = new Map(targets.map((k, i) => [k.id, results[i]!]));

        const state = await updateState((s) => {
          s.keywords = s.keywords.map((k) => {
            const r = byId.get(k.id);
            return r ? { ...k, history: r.history } : k;
          });
        });

        const mode =
          modes.size === 1
            ? ([...modes][0] as "live" | "mock")
            : modes.has("live")
              ? "mixed"
              : "mock";

        return jsonResponse({
          ...state,
          _meta: {
            mode,
            note:
              mode === "live"
                ? "SerpAPI Live-Positionen aktualisiert."
                : mode === "mixed"
                  ? "Teilweise Live, teilweise Mock (Fehler bei einzelnen Keywords)."
                  : keys.serpapi
                    ? `SerpAPI fehlgeschlagen — Mock verwendet. ${errors[0] || ""}`
                    : "Kein SERPAPI_KEY — Demo/Mock-Refresh (nicht live).",
            errors: errors.slice(0, 3),
          },
        });
      }

      case "analyzeContent": {
        if (!body.text?.trim() && !body.source?.trim()) {
          return actionError("Inhalt oder URL fehlt");
        }
        const insight = await analyzeContentInput(
          body.domainId,
          body.source || "paste",
          body.text || ""
        );
        const state = await updateState((s) => {
          s.contentInsights = [
            insight,
            ...s.contentInsights.filter((c) => c.domainId === body.domainId).slice(0, 9),
            ...s.contentInsights.filter((c) => c.domainId !== body.domainId),
          ];
        });
        return jsonResponse({
          ...state,
          _meta: {
            mode: "live",
            note: "Content-Analyse (Paste oder Live-URL-Fetch).",
          },
        });
      }

      case "importBacklinks": {
        const state = await updateState((s) => {
          for (const raw of body.items) {
            const item = raw as Record<string, unknown>;
            const referringDomain = String(item.referringDomain || item.domain || "").trim();
            if (!referringDomain) continue;
            s.backlinks.unshift({
              id: uid("bl"),
              domainId: body.domainId,
              referringDomain,
              url: String(item.url || `https://${referringDomain}/`),
              dr: Number(item.dr ?? item.authority ?? 30),
              anchor: String(item.anchor || referringDomain),
              firstSeen: String(item.firstSeen || new Date().toISOString().slice(0, 10)),
              lastSeen: String(item.lastSeen || new Date().toISOString().slice(0, 10)),
              status: (item.status as "active" | "new" | "lost") || "new",
            });
          }
        });
        return jsonResponse({
          ...state,
          _meta: { mode: "manual", note: "Backlinks importiert (manuell / JSON)." },
        });
      }

      case "addGeoPrompt": {
        const prompt = body.prompt.trim();
        if (!prompt) return actionError("Prompt fehlt");
        const engine = (body.engine || "ChatGPT") as
          | "ChatGPT"
          | "Perplexity"
          | "Gemini"
          | "Claude"
          | "Copilot";
        const state = await updateState((s) => {
          s.geoPrompts.unshift({
            id: uid("geo"),
            domainId: body.domainId,
            prompt,
            engine,
            cited: false,
            mentionRank: null,
            competitorsMentioned: [],
            citationLikelihood: 0,
            lastChecked: daysAgo(30),
          });
        });
        return jsonResponse(state);
      }

      case "refreshGeo": {
        const current = await readState();
        const domain = current.domains.find((d) => d.id === body.domainId);
        if (!domain) return actionError("Domain nicht gefunden", 404);
        const keys = resolveApiKeys(current);
        const targets = current.geoPrompts.filter((g) => g.domainId === body.domainId);
        const results: GeoRefreshResult[] = [];
        for (const g of targets) {
          // Sequential to avoid rate limits
          results.push(
            await refreshGeoPrompt({
              apiKey: keys.openai,
              prompt: g,
              brandName: domain.displayName,
              hostname: domain.hostname,
            })
          );
        }
        const byId = new Map(targets.map((g, i) => [g.id, results[i]!]));
        const modes = new Set(results.map((r) => r.mode));
        const errors = results.map((r) => r.error).filter(Boolean);

        const state = await updateState((s) => {
          s.geoPrompts = s.geoPrompts.map((g) => {
            const r = byId.get(g.id);
            return r ? { ...g, ...r.update } : g;
          });
          const prompts = s.geoPrompts.filter((g) => g.domainId === body.domainId);
          const cited = prompts.filter((g) => g.cited).length;
          const share = prompts.length
            ? Math.round((cited / prompts.length) * 100 * 0.45)
            : 0;
          const likelihood = prompts.length
            ? Math.round(
                prompts.reduce((a, g) => a + g.citationLikelihood, 0) / prompts.length
              )
            : 0;
          const today = new Date().toISOString().slice(0, 10);
          const series = s.geoSeries[body.domainId] ?? [];
          s.geoSeries[body.domainId] = [
            ...series.filter((p) => p.date !== today),
            {
              date: today,
              shareOfAnswer: share,
              citationLikelihood: likelihood,
              mentionRate: prompts.length
                ? Math.round((cited / prompts.length) * 100)
                : 0,
            },
          ].slice(-60);

          const hist = s.healthHistory[body.domainId] ?? [];
          const lastSeo = hist[hist.length - 1]?.seo ?? 50;
          s.healthHistory[body.domainId] = [
            ...hist.filter((h) => h.date !== today),
            {
              date: today,
              seo: lastSeo,
              geo: likelihood,
              overall: Math.round((lastSeo + likelihood) / 2),
            },
          ].slice(-60);
        });

        const mode =
          modes.size === 1
            ? ([...modes][0] as "live" | "mock")
            : modes.has("live")
              ? "mixed"
              : "mock";

        return jsonResponse({
          ...state,
          _meta: {
            mode,
            note:
              mode === "live"
                ? "OpenAI Live-GEO-Checks abgeschlossen."
                : mode === "mixed"
                  ? "Teilweise Live, teilweise Mock."
                  : keys.openai
                    ? `OpenAI fehlgeschlagen — Mock verwendet. ${errors[0] || ""}`
                    : "Kein OPENAI_API_KEY — Demo/Mock-Refresh (nicht live).",
            errors: errors.slice(0, 3),
          },
        });
      }

      case "addCompetitor": {
        const hostname = formatHost(body.hostname);
        if (!hostname) return actionError("Hostname fehlt");
        const current = await readState();
        if (
          current.competitors.filter((c) => c.domainId === body.domainId).length >= 4
        ) {
          return actionError("Maximal 4 Wettbewerber");
        }
        const state = await updateState((s) => {
          const cmp: Competitor = {
            id: uid("cmp"),
            domainId: body.domainId,
            hostname,
            label: body.label?.trim() || hostname,
            avgPosition: 0,
            geoMentions: 0,
            geoShare: 0,
            authority: 0,
          };
          s.competitors.push(cmp);
        });
        return jsonResponse(state);
      }

      case "removeCompetitor": {
        const state = await updateState((s) => {
          s.competitors = s.competitors.filter((c) => c.id !== body.competitorId);
        });
        return jsonResponse(state);
      }

      case "updateIssue": {
        const state = await updateState((s) => {
          const issue = s.issues.find((i) => i.id === body.issueId);
          if (issue) issue.status = body.status;
        });
        return jsonResponse(state);
      }

      case "updateSettings": {
        const state = await updateState((s) => {
          s.settings = {
            ...s.settings,
            ...body.settings,
            apiKeys: {
              ...s.settings.apiKeys,
              ...(body.settings.apiKeys || {}),
            },
          };
        });
        return jsonResponse(state);
      }

      case "resetDemo": {
        const state = await resetDemoData();
        return jsonResponse(state);
      }

      default:
        return actionError("Unbekannte Aktion");
    }
  } catch (e) {
    console.error(e);
    return actionError(e instanceof Error ? e.message : "Serverfehler", 500);
  }
}
