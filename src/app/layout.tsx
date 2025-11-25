/* eslint-disable @next/next/no-page-custom-font, @next/next/google-font-display */
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body>
        <TranslationProvider locale={locale}>{children}</TranslationProvider>
      </body>
    </html>
  );
}
