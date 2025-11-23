import React from "react";
import { BurstCard } from "./BurstCard";
import { DistillCard } from "./DistillCard";

export interface CopilotPanelProps {
  onInspiration?: () => void;
  onDistill?: () => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ onInspiration, onDistill }) => (
  <aside className="rounded-2xl bg-surface-subtle p-4 text-white space-y-4 min-w-[260px]">
    <h2 className="text-lg font-semibold">Copilot</h2>
    <BurstCard onClick={onInspiration} />
    <DistillCard onClick={onDistill} />
  </aside>
);
