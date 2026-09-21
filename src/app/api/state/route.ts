import { NextResponse } from "next/server";
import {
  analyzeContent,
  mockGeoRefresh,
  mockSerpRefresh,
  runHomepageAudit,
} from "@/lib/analyzers";
import { daysAgo } from "@/lib/seed";
import { emptyDomainBundle, formatHost } from "@/lib/selectors";
import { readState, resetDemoData, uid, updateState, writeState } from "@/lib/store";
import type { AppState, Competitor, Keyword } from "@/lib/types";

export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as AppState;
  const saved = await writeState(body);
  return NextResponse.json(saved);
}

function actionError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type ActionBody =
  | { action: "addDomain"; hostname: string; displayName?: string }
  | { action: "setActive"; domainId: string }
  | { action: "removeDomain"; domainId: string }
  | { action: "runAudit"; domainId: string }
  | { action: "addKeyword"; domainId: string; term: string; locale?: string }
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

export async function POST(request: Request) {
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
        // Seed a starter keyword so charts aren't empty
        const starter: Keyword = {
          id: uid("kw"),
          domainId: id,
          term: hostname.split(".")[0] || "marke",
          locale: "de-DE",
          volume: 100,
          history: Array.from({ length: 14 }, (_, i) => ({
            date: daysAgo(13 - i),
            position: 20 - Math.floor(i / 3),
          })),
        };
        s.keywords.push(starter);
        s.issues.push({
          id: uid("iss"),
          domainId: id,
          area: "seo",
          priority: "P1",
          title: "Ersten technischen Audit ausführen",
          description: "Für die neue Domain liegt noch kein frischer Audit vor.",
          recommendation: "Im Bereich Audit „Audit starten“ wählen.",
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
      return NextResponse.json(state);
    }

    case "setActive": {
      const current = await readState();
      if (!current.domains.some((d) => d.id === body.domainId)) {
        return actionError("Domain nicht gefunden", 404);
      }
      const state = await updateState((s) => {
        s.activeDomainId = body.domainId;
      });
      return NextResponse.json(state);
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
      return NextResponse.json(state);
    }

    case "runAudit": {
      const current = await readState();
      const domain = current.domains.find((d) => d.id === body.domainId);
      if (!domain) {
        return NextResponse.json({ error: "Domain nicht gefunden" }, { status: 404 });
      }
      const audit = await runHomepageAudit(domain.id, domain.hostname);
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
      return NextResponse.json(state);
    }

    case "addKeyword": {
      const term = body.term.trim().toLowerCase();
      if (!term) {
        return NextResponse.json({ error: "Keyword fehlt" }, { status: 400 });
      }
      const state = await updateState((s) => {
        const start = 15 + Math.floor(Math.random() * 20);
        s.keywords.push({
          id: uid("kw"),
          domainId: body.domainId,
          term,
          locale: body.locale || "de-DE",
          volume: Math.round(50 + Math.random() * 2000),
          history: Array.from({ length: 14 }, (_, i) => ({
            date: daysAgo(13 - i),
            position: Math.max(1, start - Math.floor(i / 2) + Math.round(Math.sin(i) * 2)),
          })),
        });
      });
      return NextResponse.json(state);
    }

    case "refreshKeywords": {
      const hasSerpKey = Boolean(process.env.SERPAPI_KEY);
      const state = await updateState((s) => {
        s.keywords = s.keywords.map((k) => {
          if (k.domainId !== body.domainId) return k;
          return { ...k, history: mockSerpRefresh(k.history) };
        });
        // Annotate settings stub awareness
        if (hasSerpKey && !s.settings.apiKeys.serpapi) {
          s.settings.apiKeys.serpapi = "env:SERPAPI_KEY";
        }
      });
      return NextResponse.json({
        ...state,
        _meta: {
          mode: hasSerpKey ? "env-key-present-mock-used" : "mock",
          note: hasSerpKey
            ? "SERPAPI_KEY gesetzt — Live-Connector noch Stub; Mock-Refresh verwendet."
            : "Mock-SERP-Refresh (offline).",
        },
      });
    }

    case "analyzeContent": {
      if (!body.text?.trim()) {
        return NextResponse.json({ error: "Inhalt fehlt" }, { status: 400 });
      }
      const insight = analyzeContent(body.domainId, body.source || "paste", body.text);
      const state = await updateState((s) => {
        s.contentInsights = [
          insight,
          ...s.contentInsights.filter((c) => c.domainId === body.domainId).slice(0, 9),
          ...s.contentInsights.filter((c) => c.domainId !== body.domainId),
        ];
      });
      return NextResponse.json(state);
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
      return NextResponse.json(state);
    }

    case "addGeoPrompt": {
      const prompt = body.prompt.trim();
      if (!prompt) {
        return NextResponse.json({ error: "Prompt fehlt" }, { status: 400 });
      }
      const engine = (body.engine || "Perplexity") as
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
          citationLikelihood: 35 + Math.round(Math.random() * 25),
          lastChecked: new Date().toISOString().slice(0, 10),
        });
      });
      return NextResponse.json(state);
    }

    case "refreshGeo": {
      const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
      const state = await updateState((s) => {
        s.geoPrompts = s.geoPrompts.map((g) => {
          if (g.domainId !== body.domainId) return g;
          return { ...g, ...mockGeoRefresh(g) };
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

        if (hasOpenAI && !s.settings.apiKeys.openai) {
          s.settings.apiKeys.openai = "env:OPENAI_API_KEY";
        }
      });
      return NextResponse.json({
        ...state,
        _meta: {
          mode: hasOpenAI ? "env-key-present-mock-used" : "mock",
        },
      });
    }

    case "addCompetitor": {
      const hostname = formatHost(body.hostname);
      if (!hostname) {
        return actionError("Hostname fehlt");
      }
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
          avgPosition: Math.round((3 + Math.random() * 15) * 10) / 10,
          geoMentions: Math.round(5 + Math.random() * 30),
          geoShare: Math.round(10 + Math.random() * 40),
          authority: Math.round(40 + Math.random() * 50),
        };
        s.competitors.push(cmp);
      });
      return NextResponse.json(state);
    }

    case "removeCompetitor": {
      const state = await updateState((s) => {
        s.competitors = s.competitors.filter((c) => c.id !== body.competitorId);
      });
      return NextResponse.json(state);
    }

    case "updateIssue": {
      const state = await updateState((s) => {
        const issue = s.issues.find((i) => i.id === body.issueId);
        if (issue) issue.status = body.status;
      });
      return NextResponse.json(state);
    }

    case "updateSettings": {
      const state = await updateState((s) => {
        s.settings = { ...s.settings, ...body.settings, apiKeys: {
          ...s.settings.apiKeys,
          ...(body.settings.apiKeys || {}),
        }};
      });
      return NextResponse.json(state);
    }

    case "resetDemo": {
      const state = await resetDemoData();
      return NextResponse.json(state);
    }

    default:
      return actionError("Unbekannte Aktion");
  }
  } catch (e) {
    console.error(e);
    return actionError(e instanceof Error ? e.message : "Serverfehler", 500);
  }
}
