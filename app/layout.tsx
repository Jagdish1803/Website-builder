import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Site Rebuilder",
  description: "Crawl any URL and rebuild it with a better UI using Claude.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
