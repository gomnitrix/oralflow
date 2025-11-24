import { AIClient } from "../../services/ai/client";
import { generateExpressions } from "../../services/ai/content-model";
import { createCopilotInsight, type CopilotInsight } from "../conversation/models";

export interface InspirationInput {
  bubbleId: string;
  topic: string;
}

export const runInspirationBurst = async (
  client: AIClient,
  input: InspirationInput
): Promise<CopilotInsight> => {
  const result = await generateExpressions(client, {
    prompt: `Provide an inspiration burst for: ${input.topic}`,
    capability: "copilot_inspiration",
    origin: "stwInspiration",
  });

  return createCopilotInsight({
    bubbleId: input.bubbleId,
    type: "inspiration",
    title: "Inspiration Burst",
    description: "Use these to get unstuck.",
    suggestedExpressions: result.expressions,
  });
};
