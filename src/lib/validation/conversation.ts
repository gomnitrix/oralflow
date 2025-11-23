import { z } from "zod";

export const stwEvaluateRequestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  bubbleId: z.string().min(1, "bubbleId is required"),
  text: z.string().min(1, "text is required"),
  audioUrl: z.string().url().optional().nullable(),
});

export type StwEvaluateRequest = z.infer<typeof stwEvaluateRequestSchema>;
