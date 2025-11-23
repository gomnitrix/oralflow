import type { ProviderName } from "./client";
import { AIClient, type ChatMessage, type ChatPrompt } from "./client";

export interface ConversationTurnInput {
  systemPrompt?: string;
  userText: string;
  history?: ChatMessage[];
  temperature?: number;
}

export interface ConversationTurnResult {
  reply: string;
  provider: ProviderName;
}

export const buildConversationPrompt = (input: ConversationTurnInput): ChatPrompt => {
  const baseSystem: ChatMessage = {
    role: "system",
    content:
      input.systemPrompt ??
      "You are an encouraging speaking coach. Keep replies concise and stay on topic.",
  };

  const messages: ChatMessage[] = [baseSystem, ...(input.history ?? []), {
    role: "user",
    content: input.userText,
  }];

  return { messages, temperature: input.temperature ?? 0.4 };
};

export const runConversationTurn = async (
  client: AIClient,
  input: ConversationTurnInput
): Promise<ConversationTurnResult> => {
  const prompt = buildConversationPrompt(input);
  const completion = await client.completeChat(prompt);
  return { reply: completion.message, provider: completion.provider };
};
