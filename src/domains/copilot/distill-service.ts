import { AIClient } from "../../services/ai/client";
import { generateExpressions } from "../../services/ai/content-model";
import { createCopilotInsight, type CopilotInsight } from "../conversation/models";

export interface DistillInput {
  bubbleId: string;
  transcript: string;
}

export const runDistill = async (client: AIClient, input: DistillInput): Promise<CopilotInsight> => {
  const result = await generateExpressions(client, {
    prompt: `Distill key expressions from this transcript:\n${input.transcript}`,
    origin: "stwDistill",
  });

  return createCopilotInsight({
    bubbleId: input.bubbleId,
    type: "distill",
    title: "Distilled Expressions",
    description: "Try these variants to refine your answer.",
    suggestedExpressions: result.expressions,
  });
};
