export {};
export type ScenarioSourceType = "manual" | "ai" | "import";
type ISODateString = string;

export interface ScenarioTemplate {
  id: string;
  title: string;
  emoji: string;
  description: string;
  learnerRole: string;
  aiRole: string;
  mainGoal: string;
  subGoals: string[];
  sourceType: ScenarioSourceType;
  sourceText: string | null;
  lastPracticedAt: ISODateString | null;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

const nowIso = (): ISODateString => new Date().toISOString();
const generateId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2, 10)}`;

export const createScenarioTemplate = (
  input: Omit<ScenarioTemplate, "id" | "createdAt" | "updatedAt" | "lastPracticedAt"> &
    Partial<Pick<ScenarioTemplate, "id" | "createdAt" | "updatedAt" | "lastPracticedAt">>
): ScenarioTemplate => ({
  id: input.id ?? generateId(),
  title: input.title,
  emoji: input.emoji,
  description: input.description,
  learnerRole: input.learnerRole,
  aiRole: input.aiRole,
  mainGoal: input.mainGoal,
  subGoals: input.subGoals ?? [],
  sourceType: input.sourceType,
  sourceText: input.sourceText ?? null,
  lastPracticedAt: input.lastPracticedAt ?? null,
  tags: input.tags ?? [],
  createdAt: input.createdAt ?? nowIso(),
  updatedAt: input.updatedAt ?? nowIso(),
});
