import type { Metadata } from "next";
import React from "react";
import { TranslationProvider } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oralflow Speaking Practice",
  description: "Stop-the-World and Zen speaking practice experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Locale selection could later be wired to cookies or user settings.
  const locale = "en";

  return (
    <html lang={locale}>
      <body>
        <TranslationProvider locale={locale}>{children}</TranslationProvider>
      </body>
    </html>
  );
}
