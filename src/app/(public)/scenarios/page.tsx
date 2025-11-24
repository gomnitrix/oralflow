import React from "react";
import { createServerRepositories } from "../../../services/persistence/server-repositories";
import { ScenarioLibraryClient } from "./ScenarioLibraryClient";
import { seedScenarios } from "../../../services/persistence/seeds/scenarios";

export const dynamic = 'force-dynamic'; // Ensure we always fetch fresh data

export default async function ScenarioLibraryPage() {
  const repositories = createServerRepositories();
  const scenarios = await repositories.scenarios.list();

  // If no scenarios exist yet (first run), we might want to seed them or just show empty.
  // For now, let's merge seed scenarios if list is empty, or just rely on what's in storage.
  // If we want to show seed scenarios + saved scenarios, we should seed the DB first.
  // But `seedScenarios` returns a static list.
  // Let's just show what's in the repo. If empty, user can create one.
  // OPTIONAL: If repo is empty, use seedScenarios as fallback for display?
  // Better: Just show repo items. The user can create new ones.

  // However, to not break existing experience, if repo is empty, let's show seed scenarios.
  const displayScenarios = scenarios.length > 0 ? scenarios : seedScenarios();

  return <ScenarioLibraryClient initialScenarios={displayScenarios} />;
}
