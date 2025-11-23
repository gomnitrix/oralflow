import { createReviewTask, type ReviewTask } from "./models";

export type Rating = "again" | "hard" | "good" | "easy";

const ratingAdjustments: Record<Rating, { intervalMultiplier: number; easeDelta: number }> = {
  again: { intervalMultiplier: 0.5, easeDelta: -0.2 },
  hard: { intervalMultiplier: 0.7, easeDelta: -0.05 },
  good: { intervalMultiplier: 1.0, easeDelta: 0 },
  easy: { intervalMultiplier: 1.3, easeDelta: 0.1 },
};

export const scheduleNext = (task: ReviewTask, rating: Rating): ReviewTask => {
  const adjustment = ratingAdjustments[rating];
  const nextInterval = Math.max(1, Math.round(task.intervalDays * adjustment.intervalMultiplier));
  const nextEase = Math.max(1.3, task.easeFactor + adjustment.easeDelta);
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + nextInterval);

  return createReviewTask({
    ...task,
    dueAt: dueAt.toISOString(),
    easeFactor: nextEase,
    intervalDays: nextInterval,
    repetitionCount: task.repetitionCount + 1,
    status: "pending",
    lastReviewedAt: new Date().toISOString(),
  });
};
