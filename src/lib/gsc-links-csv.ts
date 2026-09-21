/**
 * Parse Google Search Console link exports (Latest links / Top linking sites).
 * Flexible header matching (DE/EN).
 */

export type ParsedBacklinkRow = {
  referringDomain: string;
  url: string;
  anchor: string;
  dr: number;
  status: "active" | "new" | "lost";
  firstSeen: string;
  lastSeen: string;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function hostnameFromUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    return new URL(withProto).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return s
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.replace(/^www\./, "")
      .toLowerCase() || "";
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = input[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length)) rows.push(row);
  return rows;
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findCol(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normHeader);
  for (const cand of candidates) {
    const c = normHeader(cand);
    const idx = normalized.findIndex((h) => h === c || h.includes(c) || c.includes(h));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Map GSC CSV rows → backlink import items.
 */
export function parseGscLinksCsv(csvText: string): ParsedBacklinkRow[] {
  const table = parseCsv(csvText);
  if (table.length < 2) return [];

  const headers = table[0]!;
  const linkingIdx = findCol(headers, [
    "linking page",
    "linking pages",
    "verlinkende seite",
    "verlinkende seiten",
    "source",
    "from",
    "url",
  ]);
  const siteIdx = findCol(headers, [
    "site",
    "sites",
    "domain",
    "domains",
    "referring domain",
    "website",
    "top linking site",
    "top linking sites",
  ]);
  const targetIdx = findCol(headers, [
    "target page",
    "target pages",
    "zielseite",
    "zielseiten",
    "to",
    "target",
  ]);
  const anchorIdx = findCol(headers, [
    "anchor",
    "anchor text",
    "ankertxt",
    "ankertext",
    "link text",
  ]);
  const linksCountIdx = findCol(headers, ["links", "link count", "anzahl"]);

  const out: ParsedBacklinkRow[] = [];
  const seen = new Set<string>();
  const now = today();

  for (const cells of table.slice(1)) {
    const linking = linkingIdx >= 0 ? cells[linkingIdx] || "" : "";
    const site = siteIdx >= 0 ? cells[siteIdx] || "" : "";
    const target = targetIdx >= 0 ? cells[targetIdx] || "" : "";
    const anchor =
      (anchorIdx >= 0 ? cells[anchorIdx] : "") ||
      (target ? target.replace(/^https?:\/\//, "").slice(0, 80) : "") ||
      site ||
      "Link";

    const referringDomain = hostnameFromUrl(linking || site);
    if (!referringDomain) continue;

    const url =
      linking ||
      (site
        ? /^https?:\/\//i.test(site)
          ? site
          : `https://${site.replace(/^www\./, "")}/`
        : `https://${referringDomain}/`);

    const key = `${referringDomain}|${url}|${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const linkCount =
      linksCountIdx >= 0 ? Number(String(cells[linksCountIdx] || "").replace(/[^\d]/g, "")) : 0;

    out.push({
      referringDomain,
      url,
      anchor: String(anchor).slice(0, 120) || referringDomain,
      // GSC has no DR — use a modest proxy from link count when present
      dr: linkCount > 0 ? Math.min(90, 20 + Math.round(Math.log10(linkCount + 1) * 25)) : 30,
      status: "active",
      firstSeen: now,
      lastSeen: now,
    });
  }

  return out;
}
