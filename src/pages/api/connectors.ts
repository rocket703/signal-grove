import type { APIRoute } from "astro";
import { buildConnectorStatus } from "@/lib/connectors/keys";
import { readState } from "@/lib/store";

export const GET: APIRoute = async () => {
  const state = await readState();
  return new Response(JSON.stringify(buildConnectorStatus(state)), {
    headers: { "Content-Type": "application/json" },
  });
};
