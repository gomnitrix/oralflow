import { AIClient, type ProviderName } from "./client";
import { createScenarioTemplate, type ScenarioTemplate } from "../../domains/scenario/models";
import {
  createExpressionSuggestion,
  type ExpressionSuggestion,
  type ExpressionTone,
  type ExpressionOrigin,
} from "../../domains/notes/models";
import type { AssignmentCapability } from "./settings";

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
    "subGoals": ["string", "string", "string"]
  }
  IMPORTANT: The content of the JSON (values) MUST be in English, regardless of the input language.
  ROLE DESCRIPTIONS:
  - "learnerRole" and "aiRole" must be CONCISE, OBJECTIVE, CONCISE. (e.g., "A traveler lost in the city", "A helpful shop assistant").
  - Keep role descriptions short (under 10 words if possible).
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
  }, "scenario_draft");

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
    tags: [],
  });

  return { provider: completion.provider, scenario };
};

export interface ExpressionGenerationInput {
  prompt: string;
  tone?: ExpressionTone;
  origin?: ExpressionOrigin;
  capability?: AssignmentCapability;
}

export interface ExpressionGenerationResult {
  provider: ProviderName;
  expressions: ExpressionSuggestion[];
}

export const generateExpressions = async (
  client: AIClient,
  input: ExpressionGenerationInput
): Promise<ExpressionGenerationResult> => {
  const capability: AssignmentCapability = input.capability ?? "ask_ai";
  const completion = await client.completeChat({
    messages: [
      {
        role: "system",
        content: "Suggest concise expressions with meanings and short usage notes.",
      },
      { role: "user", content: input.prompt },
    ],
  }, capability);

  const suggestion = createExpressionSuggestion({
    text: completion.message || "Sample expression",
    meaning: "Placeholder meaning",
    usageNotes: "Use in a polite, concise response.",
    examples: ["Thanks for waiting, I appreciate your patience."],
    tone: input.tone ?? "neutral",
    origin: input.origin ?? "askPage",
    linkedNotebookItemId: null,
  });

  const parseList = (raw: string): ExpressionSuggestion[] => {
    const lines = raw
      .split(/\r?\n/) // break lines
      .map((line) => line.replace(/^[-*\d\.\s]+/, "").trim())
      .filter(Boolean);

    if (lines.length === 0) return [suggestion];

    return lines.slice(0, 5).map((line, idx) => {
      const [textPart, meaningPart] = line.split(/[:\-–—]\s+/, 2);
      return createExpressionSuggestion({
        text: textPart?.trim() || line,
        meaning: meaningPart?.trim() || "Useful variant",
        usageNotes: "",
        examples: [line],
        tone: input.tone ?? "neutral",
        origin: input.origin ?? "askPage",
        linkedNotebookItemId: null,
        id: `${capability}_expr_${idx}_${Math.random().toString(36).slice(2, 8)}`,
      });
    });
  };

  const expressions = parseList(completion.message || "") || [suggestion];

  return { provider: completion.provider, expressions };
};
