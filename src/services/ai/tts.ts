import { Buffer } from "buffer";

import { Stream } from "openai/streaming";

import { pcm16BufferToWavDataUrl } from "@/lib/audio/wav";

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

const getStreamAudioFormat = (provider: ProviderType): "mp3" | "pcm16" =>
  provider === "openrouter" ? "pcm16" : "mp3";

const readSampleRate = (audio: any): number | undefined => {
  const raw = audio?.sample_rate ?? audio?.sampling_rate ?? audio?.sampleRate;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const estimateMaxCompletionTokens = (text: string): number => {
  const length = text.trim().length;
  if (!length) return 256;
  const estimate = Math.ceil(length * 8);
  return Math.min(2048, Math.max(256, estimate));
};

const sniffAudioFormat = (buffer: Buffer): "mp3" | "wav" | "flac" | "opus" | "unknown" => {
  if (buffer.length < 4) return "unknown";
  const header = buffer.subarray(0, 4).toString("ascii");
  if (header === "RIFF") return "wav";
  if (header === "fLaC") return "flac";
  if (header === "OggS") return "opus";
  const header3 = buffer.subarray(0, 3).toString("ascii");
  if (header3 === "ID3") return "mp3";
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "mp3";
  return "unknown";
};

const resolveOutputFormat = (
  reported: string,
  sniffed: "mp3" | "wav" | "flac" | "opus" | "unknown",
  provider: ProviderType
): string => {
  if (sniffed !== "unknown") return sniffed;
  if (reported === "pcm16") return "pcm16";
  if (provider === "openrouter" && reported === "mp3") return "pcm16";
  return reported;
};

const buildAudioChatPayload = (model: string, text: string, format: "mp3" | "pcm16") => {
  const maxTokens = estimateMaxCompletionTokens(text);
  return {
    model,
    modalities: ["text", "audio"] as const,
    audio: { voice: "alloy", format },
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "You are a text-to-speech engine. The user message is the exact text to read aloud. Do not answer it or add any extra words. If text output is required, repeat the user's text verbatim.",
          },
        ],
      },
      { role: "user", content: [{ type: "text", text }] },
    ],
    temperature: 0,
    stream: true,
    max_completion_tokens: maxTokens,
    max_tokens: maxTokens,
  };
};

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
): Promise<{ audioBuffer: Buffer; audioFormat: string; fallbackText: string; sampleRate?: number }> => {
  const audioBuffers: Buffer[] = [];
  let audioFormat = "mp3";
  let fallbackText = "";
  let sampleRate: number | undefined;

  for await (const chunk of stream) {
    const delta = chunk?.choices?.[0]?.delta as any;
    if (!delta) continue;

    const audio = delta.audio || delta.output_audio;
    if (audio?.data) {
      audioBuffers.push(Buffer.from(audio.data, "base64"));
      if (audio.format) audioFormat = audio.format;
      sampleRate = sampleRate ?? readSampleRate(audio);
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
          audioBuffers.push(Buffer.from(partAudio.data, "base64"));
          if (partAudio.format) audioFormat = partAudio.format;
          sampleRate = sampleRate ?? readSampleRate(partAudio);
        }
      }
    }
  }

  return {
    audioBuffer: audioBuffers.length ? Buffer.concat(audioBuffers) : Buffer.alloc(0),
    audioFormat,
    fallbackText,
    sampleRate,
  };
};

const collectAudioFromCompletion = (completion: any) => {
  const message = completion?.choices?.[0]?.message;
  const messageAudio = message?.audio ?? message?.output_audio;
  const audio = extractAudioFromMessage(message);
  return {
    audioBuffer: audio.data ? Buffer.from(audio.data, "base64") : Buffer.alloc(0),
    audioFormat: audio.format ?? "mp3",
    fallbackText: extractTextFromMessage(message),
    sampleRate: readSampleRate(messageAudio),
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
    const requestPayload = buildAudioChatPayload(model, text, getStreamAudioFormat(provider));
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

    if (!result.audioBuffer.length && provider === "openrouter" && !usedDirectStream) {
      console.log("[openrouter:tts] retrying stream after empty audio");
      completion = await streamChatCompletionViaFetch(provider, requestPayload);
      usedDirectStream = true;
      result = await collectAudioFromStream(completion);
    }

    if (!result.audioBuffer.length && provider === "openrouter" && !isAsyncIterable(completion)) {
      console.log("[openrouter:tts] non-stream response", JSON.stringify(completion));
    }

    if (!result.audioBuffer.length) {
      const trimmed = result.fallbackText.trim();
      if (provider === "openrouter") {
        console.log("[openrouter:tts] no audio data", { textPreview: trimmed.slice(0, 200) });
      }
      throw new Error(
        trimmed ? `Audio output not returned: ${trimmed}` : "Audio output not returned from provider."
      );
    }

    const sniffed = sniffAudioFormat(result.audioBuffer);
    const resolvedFormat = resolveOutputFormat(result.audioFormat, sniffed, provider);
    if (provider === "openrouter") {
      console.log("[openrouter:tts] audio received", {
        reportedFormat: result.audioFormat,
        sniffedFormat: sniffed,
        resolvedFormat,
        bytes: result.audioBuffer.length,
      });
    }

    const audioUrl =
      resolvedFormat === "pcm16"
        ? pcm16BufferToWavDataUrl(result.audioBuffer, result.sampleRate ?? 24000)
        : `data:audio/${resolvedFormat};base64,${result.audioBuffer.toString("base64")}`;
    return { audioUrl, provider, model };
  }
};
