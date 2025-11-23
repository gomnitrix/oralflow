import { createTrainingSession, type TrainingMode, type TrainingSession, type ReviewTask } from "./models";

export interface SessionBuilderInput {
  mode: TrainingMode;
  tasks: ReviewTask[];
}

export const buildTrainingSession = (input: SessionBuilderInput): TrainingSession => {
  return createTrainingSession({
    mode: input.mode,
    taskIds: input.tasks.map((task) => task.id),
    endedAt: null,
  });
};

export const buildAdHocSession = (text: string): TrainingSession => {
  const task = createTrainingSession({
    mode: "adHoc",
    taskIds: [text],
    endedAt: null,
  });
  return task;
};
