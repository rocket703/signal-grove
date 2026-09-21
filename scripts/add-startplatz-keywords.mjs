#!/usr/bin/env node
/**
 * Fügt Startplatzbörse-Keywords über die laufende API ein.
 * Voraussetzung: npm run dev
 * Usage: npm run keywords:seed
 */
const BASE = process.env.SIGNAL_GROVE_URL || "http://127.0.0.1:43127";

async function main() {
  const stateRes = await fetch(`${BASE}/api/state`);
  if (!stateRes.ok) throw new Error(`API nicht erreichbar: ${BASE} — zuerst npm run dev`);
  const state = await stateRes.json();
  const domainId = state.activeDomainId;
  if (!domainId) throw new Error("Keine aktive Domain");

  const before = (state.keywords || []).filter((k) => k.domainId === domainId).length;
  console.log(`Vorher: ${before} Keywords (domain ${domainId})`);

  const res = await fetch(`${BASE}/api/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "seedKeywords", domainId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "seed fehlgeschlagen");

  const after = (data.keywords || []).filter((k) => k.domainId === domainId).length;
  console.log(data._meta?.note || "ok");
  console.log(`Nachher: ${after} Keywords`);
  console.log("→ Keywords-Seite im Browser neu laden (oder Button „Neu laden“).");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
