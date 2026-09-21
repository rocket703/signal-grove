# Signal Grove — SEO + GEO Tracker

Local-first Domain-Workspace für **klassisches SEO** und **Generative Engine Optimization (GEO)**. Eine Domain hinzufügen, Health-Score und Trends sehen, technische Audits, Keyword-Rankings, Content-Insights, Backlinks, AI-Visibility, Competitors, Issues und Reports — alles mit lokaler Persistenz.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- Persistenz: JSON-Datei unter `data/store.json` (override via `SEOGEO_DATA_DIR`)
- Keine Auth, keine bezahlten APIs nötig — Mock/Demo-Connectoren mit klaren Extension Points

## Starten

```bash
npm install
npm run dev
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

Production:

```bash
npm run build
npm start
```

## Was steckt drin

| Bereich | Funktion |
|--------|----------|
| Domain Workspace | Domains anlegen, aktiv setzen, entfernen |
| Overview | Health Score, Sparklines, SEO vs GEO, Top Issues |
| Audit | Homepage-Check (Live-Fetch oder Simulation): robots, title, meta, H1, canonical, OG, Sitemap-Hinweis, Ladezeit-Proxy |
| Keywords | Tracking inkl. Historie; Mock-SERP-Refresh aktualisiert Charts offline |
| Content | Text/URL-Analyse: Länge, Struktur, Lesbarkeit |
| Backlinks | DR-ähnliche Scores, new/lost, JSON-Import |
| GEO | Prompt Library, Citation Likelihood, Share of AI Answer, Competitor-Mentions |
| Competitors | 2–4 Wettbewerber vergleichen |
| Issues | Priorisierte SEO+GEO-Empfehlungen |
| Reports | Markdown-Download oder druckbares HTML |
| Settings | Datenpfad, Demo reset, API-Key-Stubs, GSC-Stub |

Beim ersten Start wird die Demo-Domain **nordlicht.digital** geseedet.

## Optionale Env Vars (später Live)

| Variable | Zweck |
|----------|--------|
| `SEOGEO_DATA_DIR` | Anderes Datenverzeichnis |
| `SERPAPI_KEY` | Extension Point für echte SERP-Connectoren (derzeit Mock-Refresh) |
| `OPENAI_API_KEY` | Extension Point für GEO-Probes (derzeit Mock-Refresh) |
| `PAGESPEED_API_KEY` | Extension Point für echte Performance-Messung |

Keys können auch unter **Settings** lokal vermerkt werden; ohne Keys läuft die App vollständig im Mock/Demo-Modus.

## Daten

- Store-Datei: `data/store.json` (wird automatisch angelegt)
- „Demo-Daten zurücksetzen“ in Settings stellt den Seed wieder her

## Lizenz

Privat / Projektnutzung.
