import React from "react";
import { StopTheWorldShell } from "../../../components/conversation/stw/StopTheWorldShell";
import { createServerRepositories } from "../../../services/persistence/server-repositories";
import { seedScenarios } from "../../../services/persistence/seeds/scenarios";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function StopTheWorldPage({ searchParams }: PageProps) {
  const scenarioId = typeof searchParams.scenarioId === "string" ? searchParams.scenarioId : null;

  let scenario;
  if (scenarioId) {
    const repositories = createServerRepositories();
    scenario = await repositories.scenarios.getById(scenarioId);
  }

  // Fallback to first seed scenario if not found or no ID
  if (!scenario) {
    const [first] = seedScenarios();
    scenario = first;
  }

  return (
    <main className="min-h-screen bg-custom-bg text-custom-text-dark">
      <StopTheWorldShell
        scenarioId={scenario.id}
        scenarioTitle={scenario.title}
        learnerRole={scenario.learnerRole}
        aiRole={scenario.aiRole}
        mainGoal={scenario.mainGoal}
        subGoals={scenario.subGoals}
        description={scenario.description}
      />
    </main>
  );
}
