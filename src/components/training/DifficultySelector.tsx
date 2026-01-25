import React from "react";
import type { ReviewTask } from "../../domains/training/models";
import { scheduleNext, type Rating } from "../../domains/training/srs-engine";

const ratingStyles: Record<Rating, string> = {
  forgot: "border-red-300 bg-red-50 text-red-600",
  hard: "border-orange-300 bg-orange-50 text-orange-600",
  good: "border-blue-300 bg-blue-50 text-blue-600",
  easy: "border-green-300 bg-green-50 text-green-600",
};

interface DifficultySelectorProps {
  task: ReviewTask | null;
  open: boolean;
  onSelect: (rating: Rating) => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ task, open, onSelect }) => {
  if (!open || !task) return null;

  const renderLabel = (rating: Rating) => {
    const next = scheduleNext(task, rating);
    const days = next.intervalDays;
    return `${rating === "forgot" ? "Forgot" : rating[0].toUpperCase() + rating.slice(1)} · ${days}d`;
  };

  return (
    <div className="rounded-2xl border border-custom-border bg-white p-4 shadow-lg space-y-3">
      <p className="text-xs font-semibold text-custom-text-dark/60 uppercase tracking-[0.2em]">How well did you know it?</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(ratingStyles) as Rating[]).map((rating) => (
          <button
            key={rating}
            onClick={() => onSelect(rating)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors hover:opacity-90 ${ratingStyles[rating]}`}
          >
            {renderLabel(rating)}
          </button>
        ))}
      </div>
    </div>
  );
};
