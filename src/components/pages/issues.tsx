"use client";

import { toast } from "sonner";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Issue } from "@/lib/types";
import { domainIssues, getActiveDomain, priorityTone } from "@/lib/selectors";
import { useStore } from "@/lib/use-store";

function IssueList({
  items,
  refreshing,
  onUpdate,
}: {
  items: Issue[];
  refreshing: boolean;
  onUpdate: (issueId: string, status: "open" | "done" | "dismissed") => void;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Keine Einträge.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((issue) => (
        <li
          key={issue.id}
          className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 animate-rise-delay"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={priorityTone(issue.priority)} variant="secondary">
                {issue.priority}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {issue.area}
              </Badge>
              <h3 className="font-medium text-[var(--ink)]">{issue.title}</h3>
            </div>
            {issue.status === "open" ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={refreshing}
                  onClick={() => onUpdate(issue.id, "done")}
                >
                  Erledigt
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={refreshing}
                  onClick={() => onUpdate(issue.id, "dismissed")}
                >
                  Verwerfen
                </Button>
              </div>
            ) : (
              <Badge variant="secondary">{issue.status}</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{issue.description}</p>
          <p className="mt-2 text-sm">
            <span className="font-medium">Empfehlung: </span>
            {issue.recommendation}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function IssuesPage() {
  const { state, loading, error, reload, run, refreshing } = useStore();

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!state) return null;

  const domain = getActiveDomain(state);
  if (!domain) {
    return (
      <EmptyState
        title="Issues & Recommendations"
        description="Priorisierte Maßnahmen aus SEO-Audit, Content, Authority und GEO."
      />
    );
  }

  const issues = domainIssues(state, domain.id).sort((a, b) =>
    a.priority.localeCompare(b.priority)
  );
  const open = issues.filter((i) => i.status === "open");
  const done = issues.filter((i) => i.status !== "open");

  function onUpdate(issueId: string, status: "open" | "done" | "dismissed") {
    void run({ action: "updateIssue", issueId, status }).then((r) => {
      if (r.state && status === "done") toast.success("Als erledigt markiert");
    });
  }

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Issues & Recommendations"
        description={`${open.length} offen · kombiniert technische SEO-Findings mit GEO-Lücken.`}
      />

      {issues.length === 0 ? (
        <EmptyState
          title="Keine Issues"
          description="Führe Audits und GEO-Refresh aus — Findings landen hier priorisiert."
        />
      ) : (
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Offen ({open.length})</TabsTrigger>
            <TabsTrigger value="done">Erledigt / verworfen ({done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-4">
            <Panel title="Aktionsliste">
              <IssueList items={open} refreshing={refreshing} onUpdate={onUpdate} />
            </Panel>
          </TabsContent>
          <TabsContent value="done" className="mt-4">
            <Panel title="Archiv">
              <IssueList items={done} refreshing={refreshing} onUpdate={onUpdate} />
            </Panel>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
