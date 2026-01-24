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
  const completion = await client.completeChat(
    {
      messages: [
        {
          role: "system",
          content: [
            "Return ONLY a JSON array. Each item:",
            "{ content: string, explanation: { en: string, zh: string }, examples: [string, string, string] }",
            "content MUST be a short, natural phrase (2-6 words), not a full sentence.",
            "examples MUST contain exactly 3 spoken-style sentences that use the phrase.",
          ].join("\n"),
        },
        { role: "user", content: `Source text or topic:\n${input.prompt}\nReturn JSON array only.` },
      ],
    },
    capability
  );

  const normalizePhrase = (value: string) => value.trim().replace(/[.!?]+$/g, "");

  const normalizeExamples = (value: unknown, phrase: string) => {
    const cleaned = Array.isArray(value)
      ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      : [];
    if (cleaned.length >= 3) return cleaned.slice(0, 3);
    if (!cleaned.length) {
      return [
        `I want to ${phrase}.`,
        `Could you ${phrase}?`,
        `Let’s ${phrase}.`,
      ];
    }
    const padded = [...cleaned];
    while (padded.length < 3) {
      padded.push(cleaned[cleaned.length - 1]);
    }
    return padded;
  };

  const parseStructured = (raw: string): ExpressionSuggestion[] => {
    const cleaned = raw.trim().replace(/```json\n?|```/g, "");
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        const mapped = parsed
          .map((item) => {
            const phrase = normalizePhrase(item.content || item.phrase || item.text || "");
            return createExpressionSuggestion({
              text: phrase,
              meaning: item.explanation?.zh || item.explanation?.en || "",
              usageNotes: item.explanation?.en || "",
              examples: normalizeExamples(item.examples ?? item.exampleSentences, phrase),
              tone: input.tone ?? "neutral",
              origin: input.origin ?? "askPage",
              linkedNotebookItemId: null,
            });
          })
          .filter((s) => s.text);
        if (mapped.length) return mapped;
      }
    } catch (err) {
      // fall through
    }
    return [];
  };

  const expressions =
    parseStructured(completion.message) ||
    [
      createExpressionSuggestion({
        text: normalizePhrase(completion.message || "Sample expression"),
        meaning: "Placeholder meaning",
        usageNotes: "Use in a polite, concise response.",
        examples: normalizeExamples(["Thanks for waiting, I appreciate your patience."], completion.message || "Sample expression"),
        tone: input.tone ?? "neutral",
        origin: input.origin ?? "askPage",
        linkedNotebookItemId: null,
      }),
    ];

  return { provider: completion.provider, expressions };
};
