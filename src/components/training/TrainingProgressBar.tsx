import React from "react";

interface TrainingProgressBarProps {
  current: number;
  total: number;
}

export const TrainingProgressBar: React.FC<TrainingProgressBarProps> = ({ current, total }) => {
  const clampedTotal = Math.max(1, total);
  const progress = Math.min(1, Math.max(0, current / clampedTotal));
  const percentage = `${Math.round(progress * 100)}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-custom-text-dark/60">
        <span>Session Progress</span>
        <span>
          {Math.min(current, total)}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-custom-border">
        <div className="h-2 rounded-full bg-custom-primary transition-all" style={{ width: percentage }} />
      </div>
    </div>
  );
};
