#!/usr/bin/env node
/**
 * Fügt die Startplatzbörse-Keywords in den laufenden lokalen Store ein.
 * Voraussetzung: npm run dev auf Port 43127
 *
 * Usage: node scripts/add-startplatz-keywords.mjs
 */
const BASE = process.env.SIGNAL_GROVE_URL || "http://127.0.0.1:43127";

const TERMS = [
  "startplatzbörse",
  "marathon startplatz verkaufen",
  "triathlon startplatz kaufen",
  "hyrox startplatz",
  "startplatz kaufen",
  "startplatz verkaufen",
  "marathon startplatz kaufen",
  "berlin marathon startplatz",
  "frankfurt marathon startplatz",
  "ironman startplatz verkaufen",
  "triathlon startplatz verkaufen",
  "radrennen startplatz",
  "halbmarathon startplatz",
  "ultramarathon startplatz",
  "hyrox startplatz kaufen",
  "hyrox startplatz verkaufen",
  "startplatz tausch",
  "startplatzbörse marathon",
  "startplatz inserieren",
];

async function main() {
  const stateRes = await fetch(`${BASE}/api/state`);
  if (!stateRes.ok) throw new Error(`API nicht erreichbar: ${BASE}`);
  const state = await stateRes.json();
  const domainId = state.activeDomainId;
  if (!domainId) throw new Error("Keine aktive Domain");
  const existing = new Set(
    (state.keywords || [])
      .filter((k) => k.domainId === domainId)
      .map((k) => k.term.toLowerCase())
  );

  let added = 0;
  for (const term of TERMS) {
    if (existing.has(term.toLowerCase())) {
      console.log(`skip: ${term}`);
      continue;
    }
    const res = await fetch(`${BASE}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addKeyword", domainId, term, locale: "de-DE" }),
    });
    if (!res.ok) {
      console.error(`fail: ${term}`, await res.text());
      continue;
    }
    added++;
    console.log(`ok: ${term}`);
  }
  console.log(`Fertig. Neu: ${added}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
