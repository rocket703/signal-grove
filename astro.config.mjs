// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: "server",
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 43127,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.join(root, "src"),
      },
    },
    server: {
      // Both localhost and 127.0.0.1 must hydrate (Try Live / mixed hostnames)
      allowedHosts: true,
      hmr: {
        // Let the browser reuse whatever host it opened (localhost vs 127.0.0.1)
        clientPort: Number(process.env.PORT) || 43127,
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
