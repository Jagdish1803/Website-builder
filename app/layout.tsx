import type { ReactNode } from "react";

import { ScrollProgress } from "@/components/fx/scroll-progress";
import { MotionProvider } from "@/components/motion";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = {
  title: "Site Rebuilder",
  description: "Crawl any URL and rebuild it with a better UI using Claude.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MotionProvider>
            <ScrollProgress />
            <SiteHeader />
            <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
            <Toaster richColors closeButton />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
