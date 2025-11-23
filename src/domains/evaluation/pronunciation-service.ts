import { createEvaluationRecord, type EvaluationRecord } from "../conversation/models";

export interface PronunciationInput {
  bubbleId: string;
  text: string;
  audioUrl?: string | null;
}

export interface PronunciationResult {
  record: EvaluationRecord;
}

export const evaluatePronunciation = async (
  input: PronunciationInput
): Promise<PronunciationResult> => {
  const record = createEvaluationRecord({
    bubbleId: input.bubbleId,
    pronunciationIssues: ["Placeholder pronunciation feedback"],
    grammarIssues: [],
    naturalnessNotes: [],
    nativeLikeSuggestion: "Try slowing down and articulating vowels.",
    referenceAudioUrl: input.audioUrl ?? null,
  });
  return { record };
};
