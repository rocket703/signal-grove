import { NextResponse } from "next/server";
import { buildConnectorStatus } from "@/lib/connectors/keys";
import { readState } from "@/lib/store";

export async function GET() {
  const state = await readState();
  return NextResponse.json(buildConnectorStatus(state));
}
