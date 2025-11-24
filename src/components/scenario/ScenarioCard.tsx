import React from "react";
import type { ScenarioTemplate } from "../../domains/scenario/models";
import { ScenarioLaunchpad } from "./ScenarioLaunchpad";

export interface ScenarioCardProps {
  scenario: ScenarioTemplate;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick, onDelete }) => (
  <div
    onClick={onClick}
    className="group relative cursor-pointer rounded-2xl bg-white border border-custom-border p-6 shadow-sm space-y-3 text-custom-text-dark hover:shadow-md hover:border-custom-primary/50 transition-all"
  >
    {onDelete && (
      <button
        onClick={onDelete}
        className="absolute top-4 right-4 p-2 rounded-full bg-white text-custom-text-dark/40 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Delete Scenario"
      >
        <span className="material-symbols-outlined text-xl">delete</span>
      </button>
    )}
    <div className="flex items-center gap-3">
      <span className="text-3xl group-hover:scale-110 transition-transform">{scenario.emoji}</span>
      <div>
        <p className="text-lg font-bold group-hover:text-custom-primary transition-colors">{scenario.title}</p>
        {/* Mode removed as requested */}
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
