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
  const jsonStructure = `
  Return a JSON object with this structure:
  {
    "title": "string",
    "description": "string",
    "emoji": "string (single emoji)",
    "learnerRole": "string",
    "aiRole": "string",
    "mainGoal": "string",
    "subGoals": ["string", "string", "string"],
    "preferredMode": "zen" | "stw"
  }
  `;

  if (input.mode === "manual" && input.draft) {
    return `
    Normalize this scenario draft into a structured practice scenario.
    Draft:
    - Background: ${input.draft.title || "General"}
    - User Role: ${input.draft.learnerRole || "Learner"}
    - Other Role: ${input.draft.aiRole || "Agent"}
    - Goal: ${input.draft.mainGoal || "Practice speaking"}
    ${jsonStructure}
    `;
  }

  if (input.mode === "import" && input.sourceText) {
    return `
    Analyze the following text and create a role-play scenario based on it.
    Text: "${input.sourceText}"
    ${jsonStructure}
    `;
  }

  // AI Generate Mode
  return `
  Generate a creative role-play scenario based on these keywords: "${input.keyword || "general conversation"}".
  ${jsonStructure}
  `;
};

export const generateScenario = async (
  client: AIClient,
  input: ScenarioGenerationInput
): Promise<ScenarioGenerationResult> => {
  const completion = await client.completeChat({
    messages: [
      { role: "system", content: "You are an expert language tutor. Create engaging role-play scenarios. Output ONLY valid JSON." },
      { role: "user", content: buildScenarioPrompt(input) },
    ],
  });

  let parsed: any = {};
  try {
    // Basic cleanup to handle markdown code blocks if present
    const cleanJson = completion.message.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse AI response:", completion.message);
    // Fallback to basic structure if parsing fails
    parsed = {
      title: "Generated Scenario",
      description: completion.message.slice(0, 100),
    };
  }

  const scenario = createScenarioTemplate({
    title: parsed.title || "New Scenario",
    emoji: parsed.emoji || "💬",
    description: parsed.description || "A practice scenario.",
    learnerRole: parsed.learnerRole || "Learner",
    aiRole: parsed.aiRole || "Partner",
    mainGoal: parsed.mainGoal || "Practice speaking.",
    subGoals: parsed.subGoals || [],
    sourceType: input.mode,
    sourceText: input.sourceText ?? null,
    preferredMode: parsed.preferredMode || "zen",
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
