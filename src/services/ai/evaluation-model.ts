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
    "Assess pronunciation, grammar, and naturalness.",
    "Return concise bullet points for each dimension.",
    `User text: ${input.text}`,
  ].join("\n");
};

export const evaluateUtterance = async (
  client: AIClient,
  input: EvaluationInput
): Promise<EvaluationResult> => {
  const prompt = buildEvaluationPrompt(input);
  const completion = await client.completeChat({
    messages: [
      { role: "system", content: "You are a speech coach evaluating user utterances." },
      { role: "user", content: prompt },
    ],
  });

  const record = createEvaluationRecord({
    bubbleId: input.bubbleId,
    pronunciationIssues: [`${completion.message} (pronunciation)`],
    grammarIssues: [`${completion.message} (grammar)`],
    naturalnessNotes: [`${completion.message} (naturalness)`],
    nativeLikeSuggestion: "Try simplifying the sentence for clarity.",
    referenceAudioUrl: input.audioUrl ?? null,
  });

  return { provider: completion.provider, record };
};
