import { z } from "zod";

export const scenarioTemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  emoji: z.string().min(1),
  description: z.string().min(1),
  learnerRole: z.string().min(1),
  aiRole: z.string().min(1),
  mainGoal: z.string().min(1),
  subGoals: z.array(z.string()).default([]),
  sourceType: z.enum(["manual", "ai", "import"]),
  sourceText: z.string().nullable().optional(),
  lastPracticedAt: z.string().nullable().optional(),
  preferredMode: z.enum(["stw", "zen"]).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ScenarioTemplateInput = z.infer<typeof scenarioTemplateSchema>;

export const scenarioGenerateSchema = z.object({
  mode: z.enum(["manual", "ai", "import"]),
  keyword: z.string().optional().nullable(),
  sourceText: z.string().optional().nullable(),
  draft: scenarioTemplateSchema.partial().optional().nullable(),
});

export type ScenarioGenerateRequest = z.infer<typeof scenarioGenerateSchema>;

export const scenarioCrudListSchema = z.object({
  query: z.string().optional(),
  mode: z.enum(["stw", "zen"]).optional(),
});

export type ScenarioCrudListQuery = z.infer<typeof scenarioCrudListSchema>;

export const scenarioDeleteSchema = z.object({
  id: z.string().min(1),
});

export type ScenarioDeleteParams = z.infer<typeof scenarioDeleteSchema>;
