import type { AppState } from "./types";
import {
  domainBacklinks,
  domainCompetitors,
  domainGeoPrompts,
  domainIssues,
  domainKeywords,
  getActiveDomain,
  latestHealth,
} from "./selectors";

export function buildMarkdownReport(state: AppState): string {
  const domain = getActiveDomain(state);
  if (!domain) return "# Kein aktiver Domain-Workspace\n";

  const health = latestHealth(state.healthHistory[domain.id]);
  const audit = state.audits[domain.id];
  const keywords = domainKeywords(state, domain.id);
  const geos = domainGeoPrompts(state, domain.id);
  const issues = domainIssues(state, domain.id).filter((i) => i.status === "open");
  const backlinks = domainBacklinks(state, domain.id);
  const competitors = domainCompetitors(state, domain.id);
  const geoSeries = state.geoSeries[domain.id] ?? [];
  const latestGeo = geoSeries[geoSeries.length - 1];

  const lines: string[] = [
    `# SEO + GEO Report — ${domain.displayName}`,
    "",
    `**Domain:** ${domain.hostname}  `,
    `**Erstellt:** ${new Date().toISOString()}  `,
    `**Health:** SEO ${health?.seo ?? "–"} · GEO ${health?.geo ?? "–"} · Gesamt ${health?.overall ?? "–"}`,
    "",
    "## Zusammenfassung",
    "",
    `- Technischer Audit-Score: **${audit?.score ?? "noch nicht gelaufen"}**`,
    `- Keywords getrackt: **${keywords.length}**`,
    `- GEO-Prompts: **${geos.length}** (zitiert: ${geos.filter((g) => g.cited).length})`,
    `- Share of AI Answer (aktuell): **${latestGeo?.shareOfAnswer ?? "–"}%**`,
    `- Offene Issues: **${issues.length}**`,
    `- Backlinks (Demo/Import): **${backlinks.length}**`,
    "",
    "## Top Issues",
    "",
  ];

  if (!issues.length) {
    lines.push("_Keine offenen Issues._", "");
  } else {
    for (const issue of issues.slice(0, 10)) {
      lines.push(
        `### [${issue.priority}] ${issue.title}`,
        "",
        issue.description,
        "",
        `**Empfehlung:** ${issue.recommendation}`,
        ""
      );
    }
  }

  lines.push("## Keyword-Rankings", "");
  for (const kw of keywords) {
    const pos = kw.history[kw.history.length - 1]?.position;
    lines.push(`- \`${kw.term}\` — Position **${pos ?? "–"}** (${kw.locale})`);
  }
  lines.push("", "## GEO / AI Visibility", "");
  for (const g of geos) {
    lines.push(
      `- **${g.engine}:** ${g.cited ? `zitiert (#${g.mentionRank})` : "nicht zitiert"} — Likelihood ${g.citationLikelihood}%`,
      `  - Prompt: _${g.prompt}_`
    );
  }

  lines.push("", "## Competitors", "");
  for (const c of competitors) {
    lines.push(
      `- **${c.label}** (${c.hostname}) — Avg Pos ${c.avgPosition}, GEO Share ${c.geoShare}%, Authority ${c.authority}`
    );
  }

  lines.push("", "## Audit Checks", "");
  if (!audit) {
    lines.push("_Kein Audit vorhanden._");
  } else {
    for (const check of audit.checks) {
      lines.push(
        `- **${check.title}** [${check.status}] — ${check.detail}`,
        `  - Fix: ${check.fixHint}`
      );
    }
  }

  lines.push(
    "",
    "---",
    "_Erzeugt mit Signal Grove. Audit/Content immer live (HTTP). SERP/GEO live nur mit Provider-Keys — sonst ehrlich als Mock gekennzeichnet. Backlinks nur Import/manuell._"
  );

  return lines.join("\n");
}
