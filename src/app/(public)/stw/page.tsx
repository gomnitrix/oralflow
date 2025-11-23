import React from "react";
import { StopTheWorldShell } from "../../../components/conversation/stw/StopTheWorldShell";
import { seedScenarios } from "../../../services/persistence/seeds/scenarios";

export default function StopTheWorldPage() {
  const [scenario] = seedScenarios();

  return (
    <main className="min-h-screen bg-surface text-white p-6">
      <StopTheWorldShell scenarioTitle={scenario.title} />
    </main>
  );
}
