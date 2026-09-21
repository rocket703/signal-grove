import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/app-sidebar";
import { DomainSwitcher } from "@/components/domain-switcher";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/use-store";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Signal Grove — SEO + GEO Tracker",
  description:
    "Local-first Domain-Workspace für klassisches SEO und Generative Engine Optimization.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            <StoreProvider>
              <div className="flex min-h-full flex-col lg:flex-row">
                <AppSidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="sticky top-0 z-30 hidden items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)]/85 px-6 py-3 backdrop-blur-md lg:flex">
                    <DomainSwitcher />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="signal-dot inline-block size-2 rounded-full bg-[var(--signal)]" />
                      Lokal · Mock-Connectoren bereit
                    </div>
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
      </body>
    </html>
  );
}
