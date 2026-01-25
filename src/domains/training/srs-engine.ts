import { createReviewTask, type ReviewTask } from "./models";

export type Rating = "forgot" | "hard" | "good" | "easy";

const ratingAdjustments: Record<Rating, { intervalMultiplier: number; easeDelta: number }> = {
  forgot: { intervalMultiplier: 1.0, easeDelta: -0.2 },
  hard: { intervalMultiplier: 1.2, easeDelta: -0.15 },
  good: { intervalMultiplier: 1.0, easeDelta: 0 },
  easy: { intervalMultiplier: 1.3, easeDelta: 0.15 },
};

const initialIntervalForRepetition = (repetition: number): number => {
  if (repetition <= 1) return 1;
  if (repetition === 2) return 6;
  return 0;
};

export const scheduleNext = (task: ReviewTask, rating: Rating): ReviewTask => {
  const adjustment = ratingAdjustments[rating];
  const nextEase = Math.max(1.3, task.easeFactor + adjustment.easeDelta);
  const reviewedAt = new Date();

  console.log(`[SRS] Scheduling task ${task.id} with rating ${rating}`);
  console.log(`[SRS] Current State: interval=${task.intervalDays}, ease=${task.easeFactor}, reps=${task.repetitionCount}`);

  if (rating === "forgot") {
    const dueAt = new Date(reviewedAt);
    dueAt.setDate(dueAt.getDate() + 1);
    console.log(`[SRS] Forgot -> Resetting interval to 1 day. New Ease: ${nextEase}`);
    return createReviewTask({
      ...task,
      dueAt: dueAt.toISOString(),
      easeFactor: nextEase,
      intervalDays: 1,
      repetitionCount: 0,
      status: "pending",
      lastReviewedAt: reviewedAt.toISOString(),
    });
  }

  const nextRepetition = task.repetitionCount + 1;
  const baseInterval = initialIntervalForRepetition(nextRepetition);
  const nextInterval = baseInterval
    ? Math.round(baseInterval * adjustment.intervalMultiplier)
    : Math.max(1, Math.round(task.intervalDays * nextEase * adjustment.intervalMultiplier));

  const dueAt = new Date(reviewedAt);
  dueAt.setDate(dueAt.getDate() + nextInterval);

  console.log(`[SRS] Next Interval: ${nextInterval} days. New Ease: ${nextEase}. Reps: ${nextRepetition}`);

  return createReviewTask({
    ...task,
    dueAt: dueAt.toISOString(),
    easeFactor: nextEase,
    intervalDays: nextInterval,
    repetitionCount: nextRepetition,
    status: "pending",
    lastReviewedAt: reviewedAt.toISOString(),
  });
};
