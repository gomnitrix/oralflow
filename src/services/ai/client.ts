import { type ProviderType } from "./provider-manager";
import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { type AssignmentCapability } from "./settings";
import { extractTextFromMessage } from "./message-normalizer";

export type ProviderName = ProviderType;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatPrompt {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatCompletion {
  message: string;
  provider: ProviderName;
  model: string;
}

export interface AIClientConfig {
  chatModelId?: string;
}

export class AIClient {
  async completeChat(prompt: ChatPrompt, capability: AssignmentCapability = "stw_chat"): Promise<ChatCompletion> {
    const { provider, model } = resolveModelForCapability(capability, { categoryOverride: "language" });
    const openai = createOpenAIClient(provider);

    const requestPayload = {
      model,
      messages: prompt.messages,
      temperature: prompt.temperature ?? 0.7,
    };
    if (provider === "openrouter") {
      console.log("[openrouter:chat] request", JSON.stringify(requestPayload));
    }

    const response = await openai.chat.completions.create(requestPayload);
    if (provider === "openrouter") {
      console.log("[openrouter:chat] response", JSON.stringify(response));
    }

    const choice = response.choices[0];
    const message = extractTextFromMessage(choice?.message).trim();

    if (!message) {
      throw new Error(`No completion returned from ${provider}`);
    }

    return { message, provider, model };
  }
}
