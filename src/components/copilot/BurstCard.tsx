import React from "react";
import { Button } from "../shared/Button";

export interface BurstCardProps {
  onClick?: () => void;
}

export const BurstCard: React.FC<BurstCardProps> = ({ onClick }) => (
  <div className="rounded-2xl bg-custom-bg border border-custom-border p-4 shadow-sm text-custom-text-dark space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold">Inspiration Burst</p>
        <p className="text-xs text-custom-text-dark/60">Get unstuck with quick ideas</p>
      </div>
      <span className="text-xl">⚡️</span>
    </div>
    <Button variant="secondary" onClick={onClick}>
      Generate
    </Button>
  </div>
);
