#!/usr/bin/env node
/**
 * Fügt Startplatzbörse-Keywords in den laufenden lokalen Store ein.
 * Voraussetzung: npm run dev auf Port 43127
 *
 * Usage: npm run keywords:seed
 */
const BASE = process.env.SIGNAL_GROVE_URL || "http://127.0.0.1:43127";

const TERMS = [
  // Marke / Plattform
  "startplatzbörse",
  "startplatzboerse",
  "startplatzbörse marathon",
  "startplatzbörse triathlon",
  "startplatzbörse hyrox",
  "startplatzbörse erfahrungen",
  "startplatzbörse seriös",
  "startplatz platform",
  "startplatz marktplatz",
  "startplatz community",
  // Generisch kaufen/verkaufen
  "startplatz kaufen",
  "startplatz verkaufen",
  "startplatz inserieren",
  "startplatz tausch",
  "startplatz tauschen",
  "startplatz abgeben",
  "startplatz weitergeben",
  "startplatz privat verkaufen",
  "startplatz privat kaufen",
  "startplatz gebraucht",
  "startplatz second hand",
  "startplatz übernahme",
  "startplatz freigeben",
  "startnummer verkaufen",
  "startnummer kaufen",
  "anmeldung verkaufen sport",
  // Marathon
  "marathon startplatz kaufen",
  "marathon startplatz verkaufen",
  "marathon startplatz",
  "berlin marathon startplatz",
  "berlin marathon startplatz kaufen",
  "berlin marathon startplatz verkaufen",
  "frankfurt marathon startplatz",
  "frankfurt marathon startplatz kaufen",
  "hamburg marathon startplatz",
  "hamburg marathon startplatz verkaufen",
  "köln marathon startplatz",
  "münchen marathon startplatz",
  "rheinenergie marathon startplatz",
  "bmw berlin marathon startplatz",
  "marathon startplatz kurzfristig",
  "marathon nachrücker startplatz",
  // Halbmarathon / Ultra
  "halbmarathon startplatz",
  "halbmarathon startplatz kaufen",
  "halbmarathon startplatz verkaufen",
  "ultramarathon startplatz",
  "ultramarathon startplatz kaufen",
  "trail startplatz kaufen",
  "trailrunning startplatz",
  // Triathlon / Ironman
  "triathlon startplatz kaufen",
  "triathlon startplatz verkaufen",
  "triathlon startplatz",
  "ironman startplatz verkaufen",
  "ironman startplatz kaufen",
  "ironman hamburg startplatz",
  "ironman frankfurt startplatz",
  "challenge roth startplatz",
  "challenge roth startplatz kaufen",
  "olympischer triathlon startplatz",
  "sprint triathlon startplatz",
  "mitteldistanz triathlon startplatz",
  // Hyrox
  "hyrox startplatz",
  "hyrox startplatz kaufen",
  "hyrox startplatz verkaufen",
  "hyrox doubles startplatz",
  "hyrox pro startplatz",
  "hyrox berlin startplatz",
  "hyrox hamburg startplatz",
  "hyrox köln startplatz",
  "hyrox ticket verkaufen",
  "hyrox ticket kaufen",
  // Rad / sonstige Events
  "radrennen startplatz",
  "radmarathon startplatz",
  "jedermannrennen startplatz",
  "gran fondo startplatz",
  "müritz triathlon startplatz",
  "spreewald marathon startplatz",
  // Intent / Problem
  "startplatz nicht wahrnehmen verkaufen",
  "marathon absage startplatz verkaufen",
  "verletzung startplatz verkaufen",
  "startplatz gesucht marathon",
  "startplatz gesucht triathlon",
  "startplatz gesucht hyrox",
  "last minute startplatz marathon",
  "last minute startplatz hyrox",
  "ausgebucht startplatz kaufen",
];

async function main() {
  const stateRes = await fetch(`${BASE}/api/state`);
  if (!stateRes.ok) throw new Error(`API nicht erreichbar: ${BASE} — zuerst npm run dev`);
  const state = await stateRes.json();
  const domainId = state.activeDomainId;
  if (!domainId) throw new Error("Keine aktive Domain");
  const existing = new Set(
    (state.keywords || [])
      .filter((k) => k.domainId === domainId)
      .map((k) => k.term.toLowerCase())
  );

  let added = 0;
  let skipped = 0;
  for (const term of TERMS) {
    if (existing.has(term.toLowerCase())) {
      skipped++;
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
    existing.add(term.toLowerCase());
    console.log(`ok: ${term}`);
  }
  console.log(`Fertig. Neu: ${added} · übersprungen: ${skipped} · gesamt-ziel: ${TERMS.length}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
