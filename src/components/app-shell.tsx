"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ConnectorBadge } from "@/components/connector-badge";
import { DomainSwitcher } from "@/components/domain-switcher";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/use-store";
import { ThemeProvider } from "next-themes";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <StoreProvider>
          <div className="flex min-h-full flex-col lg:flex-row">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 hidden items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)]/85 px-6 py-3 backdrop-blur-md lg:flex">
                <DomainSwitcher />
                <ConnectorBadge />
              </header>
              <div className="border-b border-[var(--line)] bg-[var(--panel)]/70 px-3 py-2 lg:hidden">
                <DomainSwitcher />
              </div>
              <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
            </div>
          </div>
          <Toaster />
        </StoreProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
