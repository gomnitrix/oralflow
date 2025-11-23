import { createEvaluationRecord, type EvaluationRecord } from "../conversation/models";

export interface GrammarInput {
  bubbleId: string;
  text: string;
}

export interface GrammarResult {
  record: EvaluationRecord;
}

export const evaluateGrammar = async (input: GrammarInput): Promise<GrammarResult> => {
  const record = createEvaluationRecord({
    bubbleId: input.bubbleId,
    pronunciationIssues: [],
    grammarIssues: ["Placeholder grammar feedback"],
    naturalnessNotes: ["Sounds slightly formal; consider simpler phrasing."],
    nativeLikeSuggestion: "Use contractions to sound more natural.",
  });
  return { record };
};
