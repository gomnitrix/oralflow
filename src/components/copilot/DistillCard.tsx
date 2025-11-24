import React from "react";
import { Button } from "../shared/Button";

export interface DistillCardProps {
  onClick?: () => void;
}

export const DistillCard: React.FC<DistillCardProps> = ({ onClick }) => (
  <div className="rounded-2xl bg-custom-bg border border-custom-border p-4 shadow-sm text-custom-text-dark space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold">Distill</p>
        <p className="text-xs text-custom-text-dark/60">Extract key phrases from the last turn</p>
      </div>
      <span className="text-xl">🔎</span>
    </div>
    <Button variant="secondary" onClick={onClick}>
      Distill
    </Button>
  </div>
);
