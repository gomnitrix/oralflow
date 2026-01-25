import { z } from "zod";

export const trainingSessionStartSchema = z.object({
  mode: z.enum(["review", "adHoc"]).default("review"),
  sourceText: z.string().optional().nullable(),
  limit: z.number().int().min(1).max(50).optional(),
  disableNewCards: z.boolean().optional(),
  lazyGeneration: z.boolean().optional(),
});

export const trainingCardEvaluateSchema = z
  .object({
    cardId: z.string().optional(),
    answerText: z.string().optional().nullable(),
    audioUrl: z.string().optional().nullable(),
    audioBase64: z.string().optional().nullable(),
    audioMimeType: z.string().optional().nullable(),
    debug: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.cardId), { message: "cardId is required." });

export const trainingItemRateSchema = z
  .object({
    taskId: z.string().optional(),
    notebookItemId: z.string().optional(),
    rating: z.enum(["forgot", "hard", "good", "easy"]),
  })
  .refine((value) => Boolean(value.taskId || value.notebookItemId), {
    message: "taskId or notebookItemId is required.",
  });

export const trainingAudioSchema = z.object({
  text: z.string().min(1).max(200),
});

export const trainingCardSupplementSchema = z.object({
  notebookItemId: z.string().min(1),
  count: z.number().int().min(1).max(10).default(3),
});

export type TrainingSessionStartRequest = z.infer<typeof trainingSessionStartSchema>;
export type TrainingCardEvaluateRequest = z.infer<typeof trainingCardEvaluateSchema>;
export type TrainingItemRateRequest = z.infer<typeof trainingItemRateSchema>;
export type TrainingAudioRequest = z.infer<typeof trainingAudioSchema>;
export type TrainingCardSupplementRequest = z.infer<typeof trainingCardSupplementSchema>;
