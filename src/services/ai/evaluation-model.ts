import { AIClient } from "./client";
import type { ProviderName } from "./client";
import {
  createEvaluationRecord,
  type EvaluationRecord,
} from "../../domains/conversation/models";

export interface EvaluationInput {
  bubbleId: string;
  text: string;
  audioUrl?: string | null;
  mode?: "stw" | "zen";
}

export interface EvaluationResult {
  provider: ProviderName;
  record: EvaluationRecord;
}

export const buildEvaluationPrompt = (input: EvaluationInput): string => {
  const mode = input.mode ?? "stw";
  return [
    `Mode: ${mode}`,
    "Assess grammar and naturalness only for the learner's sentence.",
    'Respond ONLY in JSON with keys: "grammar" (string array), "naturalness" (string array), and "native_like" (one concise rewrite a native speaker would say).',
    "Keep entries short. Do not include bullet characters in the values.",
    `User text: ${input.text}`,
  ].join("\n");
};

const sanitizeLine = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.replace(/^[\s]*[-*•▪‣·]+\s*/, "").trim();
};

const coerceList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(sanitizeLine).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n;]+/)
      .map(sanitizeLine)
      .filter(Boolean);
  }
  return [];
};

const parseEvaluationResponse = (
  message: string
): { grammar: string[]; naturalness: string[]; nativeLike?: string } => {
  const raw = message.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : raw;

  try {
    const parsed = JSON.parse(candidate);
    const grammar = coerceList(parsed.grammar ?? parsed.grammarIssues);
    const naturalness = coerceList(parsed.naturalness ?? parsed.natural ?? parsed.naturalnessNotes);
    const nativeLike =
      typeof parsed.native_like === "string"
        ? sanitizeLine(parsed.native_like)
        : typeof parsed.nativeLike === "string"
          ? sanitizeLine(parsed.nativeLike)
          : undefined;

    if (grammar.length || naturalness.length || nativeLike) {
      return {
        grammar,
        naturalness,
        nativeLike,
      };
    }
  } catch (error) {
    // Fall through to text parsing below
  }

  const lines = raw
    .split(/\n+/)
    .map(sanitizeLine)
    .filter(Boolean);

  const nativeLike =
    lines.find((line) => /^native/i.test(line)) ||
    lines.find((line) => /^suggest/i.test(line)) ||
    undefined;

  return {
    grammar: lines,
    naturalness: [],
    nativeLike: nativeLike ? nativeLike.replace(/^(native|suggestion)[:\-\s]*/i, "").trim() : undefined,
  };
};

export const evaluateUtterance = async (
  client: AIClient,
  input: EvaluationInput
): Promise<EvaluationResult> => {
  const prompt = buildEvaluationPrompt(input);
  const completion = await client.completeChat(
    {
      messages: [
        { role: "system", content: "You are a speech coach evaluating user utterances for grammar and naturalness." },
        { role: "user", content: prompt },
      ],
    },
    "stw_assessment_text"
  );

  const parsed = parseEvaluationResponse(completion.message);
  const grammarIssues = parsed.grammar.length ? parsed.grammar : [sanitizeLine(completion.message) || completion.message];
  const naturalnessNotes = parsed.naturalness;
  const nativeLikeSuggestion =
    parsed.nativeLike?.trim() || parsed.naturalness[0] || "Keep sentences concise and natural.";

  const record = createEvaluationRecord({
    bubbleId: input.bubbleId,
    pronunciationIssues: [],
    grammarIssues,
    naturalnessNotes,
    nativeLikeSuggestion,
    referenceAudioUrl: input.audioUrl ?? null,
  });

  return { provider: completion.provider, record };
};
