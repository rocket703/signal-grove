import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)]/60 px-5 py-10">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
        {title}
      </h2>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function LoadingBlock({ label = "Lade Workspace…" }: { label?: string }) {
  return (
    <div className="space-y-3 animate-pulse" aria-busy>
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-24 rounded-xl bg-muted/70" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-xl bg-muted/60" />
        <div className="h-28 rounded-xl bg-muted/60" />
        <div className="h-28 rounded-xl bg-muted/60" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-2 hover:no-underline"
        >
          Erneut versuchen
        </button>
      ) : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  children,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_1px_0_rgba(15,40,32,0.04)] transition-transform duration-300 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)]">
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
