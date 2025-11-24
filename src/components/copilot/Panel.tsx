import React from "react";
import { BurstCard } from "./BurstCard";
import { DistillCard } from "./DistillCard";

export interface CopilotPanelProps {
  onInspiration?: () => void;
  onDistill?: () => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ onInspiration, onDistill }) => (
  <aside className="rounded-2xl bg-white border border-custom-border p-6 text-custom-text-dark space-y-4 min-w-[260px] shadow-sm">
    <h2 className="text-lg font-bold">Copilot</h2>
    <BurstCard onClick={onInspiration} />
    <DistillCard onClick={onDistill} />
  </aside>
);
