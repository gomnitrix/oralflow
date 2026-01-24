import { Buffer } from "buffer";

import { Stream } from "openai/streaming";

import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { ProviderManager, type ProviderType } from "./provider-manager";
import { type AssignmentCapability } from "./settings";
import { extractAudioFromMessage, extractTextFromMessage } from "./message-normalizer";

export interface TtsResult {
  audioUrl: string;
  provider: ProviderType;
  model: string;
}

const isAsyncIterable = (value: any): value is AsyncIterable<any> =>
  !!value && typeof value[Symbol.asyncIterator] === "function";

const buildAudioChatPayload = (model: string, text: string) => ({
  model,
  modalities: ["audio", "text"] as const,
  audio: { voice: "alloy", format: "mp3" },
  messages: [
    {
      role: "system",
      content: [{ type: "text", text: "You are a text-to-speech engine. Return audio output for the provided text." }],
    },
    { role: "user", content: [{ type: "text", text }] },
  ],
  temperature: 0,
  stream: true,
});

const streamChatCompletionViaFetch = async (
  provider: ProviderType,
  payload: Record<string, unknown>
): Promise<AsyncIterable<any>> => {
  const providerConfig = ProviderManager.getInstance().getProvider(provider);
  if (!providerConfig?.apiKey) {
    throw new Error(`Provider ${provider} is not active or configured.`);
  }

  const baseUrl = (providerConfig.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;
  const controller = new AbortController();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerConfig.apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Streaming chat completion failed for ${provider} (${response.status}): ${errorText || response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error(`Streaming chat completion returned empty body for ${provider}.`);
  }

  return Stream.fromSSEResponse(response, controller);
};

const collectAudioFromStream = async (
  stream: AsyncIterable<any>
): Promise<{ audioData: string; audioFormat: string; fallbackText: string }> => {
  let audioData = "";
  let audioFormat = "mp3";
  let fallbackText = "";

  for await (const chunk of stream) {
    const delta = chunk?.choices?.[0]?.delta as any;
    if (!delta) continue;

    const audio = delta.audio || delta.output_audio;
    if (audio?.data) {
      audioData += audio.data;
      if (audio.format) audioFormat = audio.format;
    }

    const content = delta.content;
    if (typeof content === "string") {
      fallbackText += content;
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part?.text === "string") {
          fallbackText += part.text;
        } else if (typeof part?.transcript === "string") {
          fallbackText += part.transcript;
        }
        const partAudio = part?.audio || part?.output_audio;
        if (partAudio?.data) {
          audioData += partAudio.data;
          if (partAudio.format) audioFormat = partAudio.format;
        }
      }
    }
  }

  return { audioData, audioFormat, fallbackText };
};

const collectAudioFromCompletion = (completion: any) => {
  const message = completion?.choices?.[0]?.message;
  const audio = extractAudioFromMessage(message);
  return {
    audioData: audio.data ?? "",
    audioFormat: audio.format ?? "mp3",
    fallbackText: extractTextFromMessage(message),
  };
};

export const synthesizeSpeech = async (
  text: string,
  capability: AssignmentCapability = "stw_tts"
): Promise<TtsResult> => {
  const { provider, model } = resolveModelForCapability(capability, { categoryOverride: "tts", fallbackModel: "gpt-4o-mini-tts" });
  const client = createOpenAIClient(provider);

  try {
    const response = await client.audio.speech.create({
      model,
      input: text,
      voice: "alloy",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
    return { audioUrl, provider, model };
  } catch (error) {
    const requestPayload = buildAudioChatPayload(model, text);
    if (provider === "openrouter") {
      console.log("[openrouter:tts] request", JSON.stringify(requestPayload));
    }

    let completion: any;
    let usedDirectStream = false;
    try {
      completion = await client.chat.completions.create(requestPayload as any);
    } catch (err) {
      if (provider === "openrouter") {
        const payload = err as any;
        console.error("[openrouter:tts] request failed", {
          message: payload?.message,
          status: payload?.status,
          error: payload?.error,
          type: payload?.type,
          code: payload?.code,
          requestId: payload?.requestID,
        });
        console.log("[openrouter:tts] retrying with direct stream");
        completion = await streamChatCompletionViaFetch(provider, requestPayload);
        usedDirectStream = true;
      } else {
        throw err;
      }
    }

    let result = isAsyncIterable(completion)
      ? await collectAudioFromStream(completion)
      : collectAudioFromCompletion(completion);

    if (!result.audioData && provider === "openrouter" && !usedDirectStream) {
      console.log("[openrouter:tts] retrying stream after empty audio");
      completion = await streamChatCompletionViaFetch(provider, requestPayload);
      usedDirectStream = true;
      result = await collectAudioFromStream(completion);
    }

    if (!result.audioData && provider === "openrouter" && !isAsyncIterable(completion)) {
      console.log("[openrouter:tts] non-stream response", JSON.stringify(completion));
    }

    if (!result.audioData) {
      const trimmed = result.fallbackText.trim();
      if (provider === "openrouter") {
        console.log("[openrouter:tts] no audio data", { textPreview: trimmed.slice(0, 200) });
      }
      throw new Error(
        trimmed ? `Audio output not returned: ${trimmed}` : "Audio output not returned from provider."
      );
    }

    if (provider === "openrouter") {
      console.log("[openrouter:tts] audio received", { format: result.audioFormat, size: result.audioData.length });
    }
    const audioUrl = `data:audio/${result.audioFormat};base64,${result.audioData}`;
    return { audioUrl, provider, model };
  }
};
