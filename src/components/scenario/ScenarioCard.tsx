import React from "react";
import type { ScenarioTemplate } from "../../domains/scenario/models";
import { ScenarioLaunchpad } from "./ScenarioLaunchpad";

export interface ScenarioCardProps {
  scenario: ScenarioTemplate;
  onClick: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer rounded-2xl bg-white border border-custom-border p-6 shadow-sm space-y-3 text-custom-text-dark hover:shadow-md hover:border-custom-primary/50 transition-all"
  >
    <div className="flex items-center gap-3">
      <span className="text-3xl group-hover:scale-110 transition-transform">{scenario.emoji}</span>
      <div>
        <p className="text-lg font-bold group-hover:text-custom-primary transition-colors">{scenario.title}</p>
        <p className="text-xs text-custom-text-dark/60 font-medium uppercase tracking-wider">Mode: {scenario.preferredMode ?? "stw/zen"}</p>
      </div>
    </div>
    <p className="text-sm text-custom-text-dark/80 leading-relaxed line-clamp-2">{scenario.description}</p>
    {scenario.mainGoal && (
      <div className="pt-2 border-t border-custom-border/50">
        <p className="text-xs font-bold text-custom-primary uppercase tracking-wider mb-1">Main Goal</p>
        <p className="text-sm text-custom-text-dark font-medium line-clamp-1">{scenario.mainGoal}</p>
      </div>
    )}
  </div>
);
