"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  FileTextIcon,
  GlobeIcon,
  Link2Icon,
  ListChecksIcon,
  MenuIcon,
  MessageSquareQuoteIcon,
  SearchIcon,
  SettingsIcon,
  SwordsIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: ActivityIcon },
  { href: "/audit", label: "Audit", icon: SearchIcon },
  { href: "/keywords", label: "Keywords", icon: ListChecksIcon },
  { href: "/content", label: "Content", icon: FileTextIcon },
  { href: "/backlinks", label: "Backlinks", icon: Link2Icon },
  { href: "/geo", label: "GEO", icon: MessageSquareQuoteIcon },
  { href: "/competitors", label: "Competitors", icon: SwordsIcon },
  { href: "/issues", label: "Issues", icon: TriangleAlertIcon },
  { href: "/reports", label: "Reports", icon: GlobeIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-[var(--signal)]/12 text-[var(--ink)] font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                active ? "text-[var(--signal)]" : "opacity-70 group-hover:opacity-100"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-[var(--line)] bg-[var(--panel)]/80 backdrop-blur-sm lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-4">
          <div className="flex size-8 items-center justify-center rounded-md bg-[var(--ink)] text-[var(--panel)]">
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight">
              SG
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-[var(--ink)]">
              Signal Grove
            </div>
            <div className="truncate text-[11px] text-muted-foreground">SEO + GEO lokal</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t border-[var(--line)] p-3 text-[11px] leading-relaxed text-muted-foreground">
          Local-first · Demo-Connectoren · keine Cloud-Pflicht
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-[var(--line)] bg-[var(--panel)]/90 px-3 py-2 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="Menü">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-[var(--line)] px-4 py-4 text-left">
              <SheetTitle className="font-[family-name:var(--font-display)]">
                Signal Grove
              </SheetTitle>
            </SheetHeader>
            <div className="p-3">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="font-[family-name:var(--font-display)] text-sm font-semibold">
          Signal Grove
        </div>
      </div>
    </>
  );
}
