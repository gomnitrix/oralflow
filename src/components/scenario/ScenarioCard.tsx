import React from "react";
import type { ScenarioTemplate } from "../../domains/scenario/models";
import { ScenarioLaunchpad } from "./ScenarioLaunchpad";

export interface ScenarioCardProps {
  scenario: ScenarioTemplate;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario }) => (
  <div className="rounded-2xl bg-white border border-custom-border p-6 shadow-sm space-y-3 text-custom-text-dark hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <span className="text-3xl">{scenario.emoji}</span>
      <div>
        <p className="text-lg font-bold">{scenario.title}</p>
        <p className="text-xs text-custom-text-dark/60 font-medium uppercase tracking-wider">Mode: {scenario.preferredMode ?? "stw/zen"}</p>
      </div>
    </div>
    <p className="text-sm text-custom-text-dark/80 leading-relaxed">{scenario.description}</p>
    <ScenarioLaunchpad scenarioId={scenario.id} compact />
  </div>
);
