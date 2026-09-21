#!/usr/bin/env node
/**
 * Import GSC "Latest links" / "Top linking sites" CSV into Signal Grove.
 *
 * Usage (dev server must be running):
 *   npm run backlinks:gsc -- "/home/dustin/Downloads/startplatzboerse.com-Latest links-2026-09-21.csv"
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.SIGNAL_GROVE_URL || "http://127.0.0.1:43127";
const fileArg = process.argv[2];

if (!fileArg) {
  console.error(
    'Usage: npm run backlinks:gsc -- "/pfad/zur/datei.csv"'
  );
  process.exit(1);
}

const path = resolve(fileArg.replace(/^~/, process.env.HOME || ""));
const csv = readFileSync(path, "utf8");
console.log(`CSV: ${path} (${csv.length} bytes)`);

const stateRes = await fetch(`${BASE}/api/state`);
if (!stateRes.ok) {
  console.error(`API nicht erreichbar: ${BASE} — zuerst npm run dev`);
  process.exit(1);
}
const state = await stateRes.json();
const domainId = state.activeDomainId;
if (!domainId) {
  console.error("Keine aktive Domain");
  process.exit(1);
}

const res = await fetch(`${BASE}/api/state`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "importGscCsv", domainId, csv }),
});
const data = await res.json();
if (!res.ok) {
  console.error(data.error || "Import fehlgeschlagen");
  process.exit(1);
}
console.log(data._meta?.note || "ok");
const n = (data.backlinks || []).filter((b) => b.domainId === domainId).length;
console.log(`Backlinks für Domain: ${n}`);
console.log("→ Backlinks-Seite im Browser neu laden.");
