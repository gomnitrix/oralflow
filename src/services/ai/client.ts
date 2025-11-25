import { type ProviderType } from "./provider-manager";
import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { type AssignmentCapability } from "./settings";

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

    const response = await openai.chat.completions.create({
      model,
      messages: prompt.messages,
      temperature: prompt.temperature ?? 0.7,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content as any;
    const message =
      typeof content === "string"
        ? content.trim()
        : Array.isArray(content)
          ? content.map((item: any) => item?.text ?? "").join("").trim()
          : "";

    if (!message) {
      throw new Error(`No completion returned from ${provider}`);
    }

    return { message, provider, model };
  }
}
