export {};
type ISODateString = string;
export type NotebookSource = "stw" | "zen" | "ask" | "training" | "manual";
export type ExpressionTone = "formal" | "neutral" | "casual" | "other";
export type ExpressionOrigin =
  | "stwInspiration"
  | "stwDistill"
  | "zenReport"
  | "askPage"
  | "adHocText";

export interface ExpressionSuggestion {
  id: string;
  text: string;
  meaning: string;
  usageNotes: string;
  examples: string[];
  tone: ExpressionTone;
  origin: ExpressionOrigin;
  linkedNotebookItemId: string | null;
}

export interface NotebookItem {
  id: string;
  phrase: string;
  meaning: string;
  usageNotes: string;
  variants: string[];
  exampleSentences: string[];
  contextSentence: string;
  ipa: string;
  spokenNotes: string;
  source: NotebookSource;
  sourceDetails: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  locale?: string;
  tags: string[];
}

const nowIso = (): ISODateString => new Date().toISOString();
const generateId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2, 10)}`;

export const createExpressionSuggestion = (
  input: Omit<ExpressionSuggestion, "id"> & { id?: string }
): ExpressionSuggestion => ({
  id: input.id ?? generateId(),
  text: input.text,
  meaning: input.meaning,
  usageNotes: input.usageNotes ?? "",
  examples: input.examples ?? [],
  tone: input.tone ?? "neutral",
  origin: input.origin,
  linkedNotebookItemId: input.linkedNotebookItemId ?? null,
});

export const createNotebookItem = (
  input: Omit<NotebookItem, "id" | "createdAt" | "updatedAt"> &
    Partial<Pick<NotebookItem, "id" | "createdAt" | "updatedAt">>
): NotebookItem => ({
  id: input.id ?? generateId(),
  phrase: input.phrase,
  meaning: input.meaning,
  usageNotes: input.usageNotes ?? "",
  variants: input.variants ?? [],
  exampleSentences: input.exampleSentences ?? [],
  contextSentence: input.contextSentence ?? "",
  ipa: input.ipa ?? "",
  spokenNotes: input.spokenNotes ?? "",
  source: input.source,
  sourceDetails: input.sourceDetails ?? "",
  tags: input.tags ?? [],
  createdAt: input.createdAt ?? nowIso(),
  updatedAt: input.updatedAt ?? nowIso(),
});
