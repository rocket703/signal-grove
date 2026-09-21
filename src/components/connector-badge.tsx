"use client";

import { useStore } from "@/lib/use-store";

export function ConnectorBadge() {
  const { connectors } = useStore();
  if (!connectors) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
        Connector-Status…
      </div>
    );
  }

  const liveBits: string[] = ["Audit live"];
  if (connectors.serp.mode === "live") liveBits.push("SERP live");
  if (connectors.geo.mode === "live") liveBits.push("GEO live");
  if (connectors.pagespeed.mode === "live") liveBits.push("PSI live");

  const offlineNeeded =
    connectors.serp.mode === "offline" || connectors.geo.mode === "offline";

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={`signal-dot inline-block size-2 rounded-full ${
          connectors.anyLiveProvider || true ? "bg-[var(--signal)]" : "bg-amber-500"
        }`}
      />
      <span>
        {liveBits.join(" · ")}
        {offlineNeeded ? " · Keys optional für SERP/GEO" : ""}
      </span>
    </div>
  );
}
