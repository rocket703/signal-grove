import type { APIRoute } from "astro";
import { buildMarkdownReport } from "@/lib/report";
import { readState } from "@/lib/store";

export const GET: APIRoute = async ({ request }) => {
  const state = await readState();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "markdown";
  const md = buildMarkdownReport(state);

  if (format === "html") {
    const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<title>SEO GEO Report</title>
<style>
  :root { color-scheme: light; }
  body { font-family: "IBM Plex Sans", Georgia, serif; max-width: 820px; margin: 2rem auto; padding: 0 1.25rem; color: #14201c; line-height: 1.55; background: #f4f7f5; }
  h1,h2,h3 { font-family: "Fraunces", Georgia, serif; color: #0b3d32; }
  code { background: #e4ece7; padding: 0.1rem 0.35rem; border-radius: 4px; }
  hr { border: none; border-top: 1px solid #c9d6cf; margin: 2rem 0; }
  @media print { body { background: white; } }
</style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: inherit;">${md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>
<script>/* printable */</script>
</body>
</html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="seo-geo-report.md"',
    },
  });
}
