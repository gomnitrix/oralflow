import React from "react";
import { ZenShell } from "../../../components/conversation/zen/ZenShell";
import { ZenReportPanel } from "../../../components/conversation/zen/ZenReportPanel";

export default function ZenPage() {
  return (
    <main className="min-h-screen bg-surface text-white p-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ZenShell />
        <ZenReportPanel />
      </div>
    </main>
  );
}
