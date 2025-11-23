import React from "react";
import { Button } from "../shared/Button";

export interface BurstCardProps {
  onClick?: () => void;
}

export const BurstCard: React.FC<BurstCardProps> = ({ onClick }) => (
  <div className="rounded-2xl bg-surface-card p-4 shadow-card text-white space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">Inspiration Burst</p>
        <p className="text-xs text-white/60">Get unstuck with quick ideas</p>
      </div>
      <span className="text-xl">⚡️</span>
    </div>
    <Button variant="secondary" onClick={onClick}>
      Generate
    </Button>
  </div>
);
