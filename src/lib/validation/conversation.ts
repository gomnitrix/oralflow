import { z } from "zod";

export const stwEvaluateRequestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  bubbleId: z.string().min(1, "bubbleId is required"),
  text: z.string().min(1, "text is required"),
  audioUrl: z.string().url().optional().nullable(),
  audioBase64: z.string().min(1, "audioBase64 is required").optional().nullable(),
  audioMimeType: z.string().optional().nullable(),
});

export type StwEvaluateRequest = z.infer<typeof stwEvaluateRequestSchema>;

const scenarioContextSchema = z.object({
  scenarioId: z.string().min(1, "scenarioId is required"),
  title: z.string().min(1, "title is required"),
  learnerRole: z.string().optional().nullable(),
  aiRole: z.string().optional().nullable(),
  mainGoal: z.string().optional().nullable(),
  subGoals: z.array(z.string()).optional().nullable(),
  description: z.string().optional().nullable(),
});

const stwHistoryMessageSchema = z.object({
  speaker: z.enum(["user", "ai"]),
  text: z.string().min(1, "text is required"),
});

export const stwStartRequestSchema = z.object({
  scenario: scenarioContextSchema,
});

export type StwStartRequest = z.infer<typeof stwStartRequestSchema>;

export const stwReplyRequestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  scenario: scenarioContextSchema,
  history: z.array(stwHistoryMessageSchema).default([]),
  userText: z.string().min(1, "userText is required"),
  skipGoalEvaluation: z.boolean().optional().default(false),
});

export type StwReplyRequest = z.infer<typeof stwReplyRequestSchema>;

export const stwCopilotRequestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  bubbleId: z.string().min(1, "bubbleId is required"),
  bubbleText: z.string().min(1, "bubbleText is required"),
  type: z.enum(["distill", "inspiration"]),
  topic: z.string().optional().nullable(),
  history: z.array(stwHistoryMessageSchema).optional().default([]),
});

export type StwCopilotRequest = z.infer<typeof stwCopilotRequestSchema>;

export const stwTranscribeRequestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  audioBase64: z.string().min(1, "audioBase64 is required"),
  mimeType: z.string().optional().nullable(),
  durationMs: z.number().optional().nullable(),
});

export type StwTranscribeRequest = z.infer<typeof stwTranscribeRequestSchema>;
