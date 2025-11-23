import type { ReviewTask } from "./models";
import { scheduleNext, type Rating } from "./srs-engine";

export const applyRating = (task: ReviewTask, rating: Rating): ReviewTask => {
  return scheduleNext(task, rating);
};
