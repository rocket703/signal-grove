# Signal Grove — SEO + GEO Tracker

Self-hostable Domain-Workspace für **klassisches SEO** und **Generative Engine Optimization (GEO)**.  
Seed-Domain: **startplatzboerse.com**. Persistenz lokal als JSON.

## Was ist live vs. braucht Keys

| Bereich | Ohne Key | Mit Key / immer |
|--------|----------|-----------------|
| Technical Audit | — | **Immer live** HTTP-Fetch (Title, Meta, robots, Canonical, OG, …) |
| Content Insights | — | **Live** Paste oder URL-Fetch + lokale Analyse |
| Keywords / SERP | Demo/Mock, klar gelabelt | **Live** mit `SERPAPI_KEY` |
| GEO / AI Visibility | Demo/Mock, klar gelabelt | **Live** mit `OPENAI_API_KEY` |
| PageSpeed im Audit | Fetch-TTFB-Proxy | **Live** mit `PAGESPEED_API_KEY` |
| Backlinks | — | **Nur manuell / JSON-Import** (kein Fake-Live) |

## Lokal starten

```bash
cp .env.example .env   # Keys optional eintragen
npm install
npm run dev
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127) (bindet auf `0.0.0.0`, Port via `PORT`).

Production ohne Docker:

```bash
npm run build
npm start
```

## Docker (VPS / Self-host)

```bash
cp .env.example .env
# SERPAPI_KEY / OPENAI_API_KEY optional setzen
docker compose up -d --build
```

- App: `http://<server>:43127`
- Datenvolumen: `signal_grove_data` → `/data/store.json` im Container
- Port ändern: `PORT=8080 docker compose up -d`

Nur Image bauen:

```bash
docker build -t signal-grove .
docker run --rm -p 43127:43127 \
  -e DATA_DIR=/data \
  -v signal_grove_data:/data \
  -e SERPAPI_KEY -e OPENAI_API_KEY -e PAGESPEED_API_KEY \
  signal-grove
```

## Env Vars

| Variable | Zweck |
|----------|--------|
| `PORT` | HTTP-Port (default `43127`) |
| `DATA_DIR` | Verzeichnis für `store.json` (Docker: `/data`) |
| `SEOGEO_DATA_DIR` | Alias für `DATA_DIR` |
| `SERPAPI_KEY` | Live Google Organic Rankings |
| `OPENAI_API_KEY` | Live GEO prompt/citation checks |
| `OPENAI_BASE_URL` | Optional OpenAI-kompatibler Endpoint |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `PAGESPEED_API_KEY` | Optional Lighthouse Performance im Audit |

Keys können auch unter **Settings** gespeichert werden; **Env hat Vorrang**.

## GitHub / Deploy

Dieses Projekt startete als Cursor Cloud `agent_temp`-Repo (kein Draft-PR möglich). Branch: `cursor/seo-geo-tracker-d857`.

Auf GitHub bringen (auf deiner Maschine mit `gh` Auth):

```bash
# Option A: neues Repo erstellen und pushen
gh repo create signal-grove --private --source=. --remote=github --push

# Option B: bestehendes leeres Repo
git remote add github git@github.com:<USER>/signal-grove.git
git push -u github cursor/seo-geo-tracker-d857:main
```

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · JSON-Persistenz
