export { };
type ISODateString = string;
export type ReviewStatus = "pending" | "completed";
export type TrainingMode = "review" | "adHoc";

export type CardType = "answer_generation" | "ask_question" | "translation" | "read_aloud";

export interface ReviewCardContent {
  frontContent: {
    context: string;
    task: string;
    cue: string;
  };
  backContent: {
    referenceAnswer: string;
  };
}

export interface ReviewCardMetadata {
  locale?: string;
  source?: "generated" | "manual" | "import";
  tags?: string[];
  debug?: {
    systemPrompt: string;
    userPrompt: string;
  };
}

export interface ReviewCard {
  id: string;
  notebookItemId: string;
  type: CardType;
  content: ReviewCardContent;
  metadata: ReviewCardMetadata | null;
  createdAt: ISODateString;
  lastUsedAt: ISODateString | null;
  usageCount: number;
}

export interface ReviewTask {
  id: string;
  notebookItemId: string;
  dueAt: ISODateString;
  lastReviewedAt: ISODateString | null;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  status: ReviewStatus;
}

export interface TrainingSession {
  id: string;
  startedAt: ISODateString;
  endedAt: ISODateString | null;
  taskIds: string[];
  mode: TrainingMode;
}

const nowIso = (): ISODateString => new Date().toISOString();
const generateId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2, 10)}`;

export const createReviewCard = (
  input: Omit<ReviewCard, "id" | "createdAt" | "lastUsedAt" | "usageCount"> &
    Partial<Pick<ReviewCard, "id" | "createdAt" | "lastUsedAt" | "usageCount">>
): ReviewCard => ({
  id: input.id ?? generateId(),
  notebookItemId: input.notebookItemId,
  type: input.type,
  content: input.content,
  metadata: input.metadata ?? null,
  createdAt: input.createdAt ?? nowIso(),
  lastUsedAt: input.lastUsedAt ?? null,
  usageCount: input.usageCount ?? 0,
});

export const createReviewTask = (
  input: Omit<ReviewTask, "id" | "status"> & Partial<Pick<ReviewTask, "id" | "status">>
): ReviewTask => ({
  id: input.id ?? generateId(),
  notebookItemId: input.notebookItemId,
  dueAt: input.dueAt ?? nowIso(),
  lastReviewedAt: input.lastReviewedAt ?? null,
  intervalDays: input.intervalDays ?? 1,
  easeFactor: input.easeFactor ?? 2.5,
  repetitionCount: input.repetitionCount ?? 0,
  status: input.status ?? "pending",
});

export const createTrainingSession = (
  input: Omit<TrainingSession, "id" | "startedAt"> &
    Partial<Pick<TrainingSession, "id" | "startedAt">>
): TrainingSession => ({
  id: input.id ?? generateId(),
  startedAt: input.startedAt ?? nowIso(),
  endedAt: input.endedAt ?? null,
  taskIds: input.taskIds ?? [],
  mode: input.mode,
});
