import React from "react";
import type { ScenarioTemplate } from "../../domains/scenario/models";
import { ScenarioLaunchpad } from "./ScenarioLaunchpad";

export interface ScenarioCardProps {
  scenario: ScenarioTemplate;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario }) => (
  <div className="rounded-2xl bg-surface-card p-4 shadow-card space-y-2 text-white">
    <div className="flex items-center gap-2">
      <span className="text-2xl">{scenario.emoji}</span>
      <div>
        <p className="text-lg font-semibold">{scenario.title}</p>
        <p className="text-xs text-white/60">Mode: {scenario.preferredMode ?? "stw/zen"}</p>
      </div>
    </div>
    <p className="text-sm text-white/80">{scenario.description}</p>
    <ScenarioLaunchpad scenarioId={scenario.id} compact />
  </div>
);
