import { AIClient, type ProviderName } from "./client";
import { createScenarioTemplate, type ScenarioTemplate } from "../../domains/scenario/models";
import {
  createExpressionSuggestion,
  type ExpressionSuggestion,
  type ExpressionTone,
  type ExpressionOrigin,
} from "../../domains/notes/models";

export interface ScenarioGenerationInput {
  mode: "manual" | "ai" | "import";
  keyword?: string | null;
  sourceText?: string | null;
  draft?: Partial<ScenarioTemplate> | null;
}

export interface ScenarioGenerationResult {
  provider: ProviderName;
  scenario: ScenarioTemplate;
}

export const buildScenarioPrompt = (input: ScenarioGenerationInput): string => {
  if (input.mode === "manual" && input.draft?.title) {
    return `Normalize this scenario for practice:\nTitle: ${input.draft.title}\nDescription: ${input.draft.description ?? ""}`;
  }
  if (input.mode === "import" && input.sourceText) {
    return `Convert the imported text into a concise scenario card:\n${input.sourceText}`;
  }
  return `Generate a speaking scenario about: ${input.keyword ?? "general conversation"}`;
};

export const generateScenario = async (
  client: AIClient,
  input: ScenarioGenerationInput
): Promise<ScenarioGenerationResult> => {
  const completion = await client.completeChat({
    messages: [
      { role: "system", content: "Create short, goal-focused scenarios for speaking practice." },
      { role: "user", content: buildScenarioPrompt(input) },
    ],
  });

  const scenario = createScenarioTemplate({
    title: input.draft?.title ?? (completion.message.slice(0, 60) || "Practice Scenario"),
    emoji: input.draft?.emoji ?? "🗣️",
    description: input.draft?.description ?? "Improve speaking confidence in a guided role-play.",
    learnerRole: input.draft?.learnerRole ?? "Learner",
    aiRole: input.draft?.aiRole ?? "Coach",
    mainGoal: input.draft?.mainGoal ?? "Hold a focused conversation on the topic.",
    subGoals: input.draft?.subGoals ?? ["Practice pronunciation", "Stay concise"],
    sourceType: input.mode,
    sourceText: input.sourceText ?? null,
    preferredMode: input.draft?.preferredMode ?? null,
  });

  return { provider: completion.provider, scenario };
};

export interface ExpressionGenerationInput {
  prompt: string;
  tone?: ExpressionTone;
  origin?: ExpressionOrigin;
}

export interface ExpressionGenerationResult {
  provider: ProviderName;
  expressions: ExpressionSuggestion[];
}

export const generateExpressions = async (
  client: AIClient,
  input: ExpressionGenerationInput
): Promise<ExpressionGenerationResult> => {
  const completion = await client.completeChat({
    messages: [
      {
        role: "system",
        content: "Suggest concise expressions with meanings and short usage notes.",
      },
      { role: "user", content: input.prompt },
    ],
  });

  const suggestion = createExpressionSuggestion({
    text: completion.message || "Sample expression",
    meaning: "Placeholder meaning",
    usageNotes: "Use in a polite, concise response.",
    examples: ["Thanks for waiting, I appreciate your patience."],
    tone: input.tone ?? "neutral",
    origin: input.origin ?? "askPage",
    linkedNotebookItemId: null,
  });

  return { provider: completion.provider, expressions: [suggestion] };
};
