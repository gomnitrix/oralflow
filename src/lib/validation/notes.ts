import { z } from "zod";

export const expressionSuggestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  meaning: z.string().min(1),
  usageNotes: z.string().optional().default(""),
  examples: z.array(z.string()).default([]),
  tone: z.enum(["formal", "neutral", "casual", "other"]).optional().default("neutral"),
  origin: z
    .enum(["stwInspiration", "stwDistill", "zenReport", "askPage", "adHocText"])
    .optional()
    .default("askPage"),
  linkedNotebookItemId: z.string().optional().nullable(),
});

export const notebookItemSchema = z.object({
  id: z.string().min(1),
  phrase: z.string().min(1),
  meaning: z.string().min(1),
  usageNotes: z.string().optional().default(""),
  variants: z.array(z.string()).default([]),
  exampleSentences: z.array(z.string()).default([]),
  contextSentence: z.string().optional().default(""),
  ipa: z.string().optional().default(""),
  spokenNotes: z.string().optional().default(""),
  source: z.enum(["stw", "zen", "ask", "training", "manual"]),
  sourceDetails: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type NotebookItemInput = z.infer<typeof notebookItemSchema>;

export const trainingScheduleSchema = z.object({
  mode: z.enum(["review", "adHoc"]),
  sourceText: z.string().optional().nullable(),
});

export type TrainingScheduleRequest = z.infer<typeof trainingScheduleSchema>;
