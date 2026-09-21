# Signal Grove — SEO + GEO Tracker (Astro)

Wie Startplatzbörse: **Astro** + `npm run dev`. Self-hostable. Seed: **startplatzboerse.com**.

## Lokal (auf deinem Rechner)

```bash
npm install
npm run dev
```

Dann im **Browser deines Laptops**: [http://127.0.0.1:43127](http://127.0.0.1:43127)

> Cloud-Agent-Links mit `127.0.0.1` öffnen die App **nicht** auf deinem Laptop — das ist die VM. Lokal klonen und `npm run dev`, oder Try Live auf dem Agent-Desktop nutzen.

## Was ist live

| Bereich | Verhalten |
|--------|-----------|
| Audit / Content | Immer echter HTTP-Fetch |
| Keywords | Live mit `SERPAPI_KEY`, sonst ehrliches Mock |
| GEO | Live mit `OPENAI_API_KEY`, sonst ehrliches Mock |
| Backlinks | GSC-CSV („Latest links“ / „Top linking sites“) oder JSON — kein Live-Crawler |

## Backlinks aus Google Search Console

1. In GSC → Links → **Latest links** (oder Top linking sites) → CSV exportieren  
2. App laufen lassen (`npm run dev`), dann entweder:
   - **Backlinks**-Seite → Datei wählen / CSV einfügen → **GSC-CSV importieren**, oder
   - CLI (Server muss laufen):

```bash
npm run backlinks:gsc -- "/home/dustin/Downloads/startplatzboerse.com-Latest links-2026-09-21.csv"
```

GSC liefert keinen Domain-Rating — der Score in der Tabelle ist nur ein Proxy.

## Docker

```bash
cp .env.example .env
docker compose up -d --build
```

## Env

Siehe `.env.example`: `PORT`, `DATA_DIR`, `SERPAPI_KEY`, `OPENAI_API_KEY`, `PAGESPEED_API_KEY`.
