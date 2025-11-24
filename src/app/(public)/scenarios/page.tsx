import React from "react";
import { ScenarioCard } from "../../../components/scenario/ScenarioCard";
import { ScenarioLaunchpad } from "../../../components/scenario/ScenarioLaunchpad";
import { seedScenarios } from "../../../services/persistence/seeds/scenarios";

export default function ScenarioLibraryPage() {
  const scenarios = seedScenarios();

  return (
    <main className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Scenario Library</h1>
          <p className="text-custom-text-dark/60 text-base font-normal leading-normal">Browse and launch practice scenarios.</p>
        </div>
        <ScenarioLaunchpad scenarioId={scenarios[0].id} />
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>
    </main>
  );
}
