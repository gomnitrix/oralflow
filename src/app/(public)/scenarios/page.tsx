import React from "react";
import { ScenarioCard } from "../../../components/scenario/ScenarioCard";
import { ScenarioLaunchpad } from "../../../components/scenario/ScenarioLaunchpad";
import { seedScenarios } from "../../../services/persistence/seeds/scenarios";

export default function ScenarioLibraryPage() {
  const scenarios = seedScenarios();

  return (
    <main className="min-h-screen bg-surface text-white p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scenario Library</h1>
          <p className="text-white/70">Browse and launch practice scenarios.</p>
        </div>
        <ScenarioLaunchpad scenarioId={scenarios[0].id} />
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>
    </main>
  );
}
