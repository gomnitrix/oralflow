import React from "react";
import { StopTheWorldShell } from "../../../components/conversation/stw/StopTheWorldShell";
import { createServerRepositories } from "../../../services/persistence/server-repositories";
import { seedScenarios } from "../../../services/persistence/seeds/scenarios";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function StopTheWorldPage({ searchParams }: PageProps) {
  const context = typeof searchParams.context === "string" ? searchParams.context : null;
  const contextTitle = typeof searchParams.title === "string" ? searchParams.title : null;
  const learnerRole = typeof searchParams.userRole === "string" ? searchParams.userRole : null;
  const aiRole = typeof searchParams.aiRole === "string" ? searchParams.aiRole : null;
  const contextId = typeof searchParams.contextId === "string" ? searchParams.contextId : null;
  const summary = typeof searchParams.summary === "string" ? searchParams.summary : null;

  if (context) {
    const scenario = {
      id: contextId || `context-${Date.now()}`,
      title: contextTitle?.slice(0, 140) || "Free Chat",
      learnerRole: learnerRole || "You",
      aiRole: aiRole || "AI Partner",
      mainGoal: summary || null,
      subGoals: context ? [context] : [],
      description: context,
    };

    return (
      <main className="min-h-screen bg-custom-bg text-custom-text-dark">
        <StopTheWorldShell
          scenarioId={scenario.id}
          scenarioTitle={scenario.title}
          learnerRole={scenario.learnerRole}
          aiRole={scenario.aiRole}
          mainGoal={scenario.mainGoal ?? undefined}
          subGoals={scenario.subGoals}
          description={scenario.description}
        />
      </main>
    );
  }

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
