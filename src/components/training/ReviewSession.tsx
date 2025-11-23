import React from "react";
import type { ReviewTask } from "../../domains/training/models";
import { RatingControls } from "./RatingControls";

export interface ReviewSessionProps {
  tasks: ReviewTask[];
  onRate?: (taskId: string, rating: "again" | "hard" | "good" | "easy") => void;
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({ tasks, onRate }) => {
  if (!tasks.length) {
    return (
      <div className="rounded-2xl bg-surface-card p-4 text-white shadow-card space-y-2">
        <p className="text-sm font-semibold">All caught up!</p>
        <p className="text-xs text-white/70">
          Save new expressions via Ask or Scenario Studio to get fresh reviews.
        </p>
        <div className="flex gap-2">
          <a className="text-accent text-sm underline" href="/ask">
            Go to Ask
          </a>
          <a className="text-accent text-sm underline" href="/scenarios/create">
            Scenario Studio
          </a>
        </div>
      </div>
    );
  }

  const task = tasks[0];

  return (
    <div className="rounded-2xl bg-surface-card p-4 text-white shadow-card space-y-3">
      <p className="text-sm text-white/70">Task #{task.id}</p>
      <p className="text-lg font-semibold">Review the associated notebook item.</p>
      <RatingControls onSelect={(rating) => onRate?.(task.id, rating)} />
    </div>
  );
};
