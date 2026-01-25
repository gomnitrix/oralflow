import { Buffer } from "buffer";

import { pcm16BufferToWavDataUrl } from "@/lib/audio/wav";

import { buildConversationPrompt, type ConversationTurnInput } from "./conversation-model";
import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { type ProviderType } from "./provider-manager";
import { type AssignmentCapability } from "./settings";

export interface AudioConversationTurnResult {
  reply: string;
  audioUrl: string;
  provider: ProviderType;
  model: string;
}

const getAudioFormat = (provider: ProviderType): "mp3" | "pcm16" =>
  provider === "openrouter" ? "pcm16" : "mp3";

const estimateMaxCompletionTokens = (text: string): number => {
  const length = text.trim().length;
  if (!length) return 256;
  const estimate = Math.ceil(length * 8);
  return Math.min(1024, Math.max(256, estimate));
};

const normalizeContentText = (content: any, fallbackTranscript: string[]) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.transcript === "string") {
          fallbackTranscript.push(part.transcript);
        }
        return "";
      })
      .join("");
  }
  return "";
};

const collectAudioFromStream = async (
  stream: AsyncIterable<any>,
  requestedFormat: "mp3" | "pcm16"
): Promise<{ audioBuffer: Buffer; audioFormat: string; reply: string; transcript: string }> => {
  const audioBuffers: Buffer[] = [];
  let audioFormat = requestedFormat;
  const replyParts: string[] = [];
  const transcriptParts: string[] = [];

  for await (const chunk of stream) {
    const choice = chunk?.choices?.[0] as any;
    const delta = choice?.delta as any;
    const message = choice?.message as any;

    if (delta) {
      const audio = delta.audio || delta.output_audio;
      if (audio?.data) {
        audioBuffers.push(Buffer.from(audio.data, "base64"));
        if (audio.format) audioFormat = audio.format;
        if (typeof audio.transcript === "string") {
          transcriptParts.push(audio.transcript);
        }
      }

      const contentText = normalizeContentText(delta.content, transcriptParts);
      if (contentText) {
        replyParts.push(contentText);
      }
    }

    if (message) {
      const hasAudio = audioBuffers.length > 0;
      const hasText = replyParts.length > 0;
      const hasTranscript = transcriptParts.length > 0;
      const audio = message.audio || message.output_audio;

      if (audio?.data && !hasAudio) {
        audioBuffers.push(Buffer.from(audio.data, "base64"));
        if (audio.format) audioFormat = audio.format;
      }
      if (typeof audio?.transcript === "string" && !hasTranscript) {
        transcriptParts.push(audio.transcript);
      }

      const messageText = normalizeContentText(message.content, transcriptParts);
      if (messageText && !hasText) {
        replyParts.push(messageText);
      }
    }
  }

  return {
    audioBuffer: audioBuffers.length ? Buffer.concat(audioBuffers) : Buffer.alloc(0),
    audioFormat,
    reply: replyParts.join(""),
    transcript: transcriptParts.join(""),
  };
};

export const runAudioConversationTurn = async (
  input: ConversationTurnInput,
  capability: AssignmentCapability = "stw_audio"
): Promise<AudioConversationTurnResult> => {
  const prompt = buildConversationPrompt(input);
  const { provider, model } = resolveModelForCapability(capability, { categoryOverride: "language" });
  const client = createOpenAIClient(provider);

  const requestedFormat = getAudioFormat(provider);
  const maxTokens = estimateMaxCompletionTokens(input.userText);

  const messages = prompt.messages.map((message) => ({
    role: message.role,
    content: [{ type: "text", text: message.content }],
  }));

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: prompt.temperature ?? 0.4,
    modalities: ["text", "audio"],
    audio: { voice: "alloy", format: requestedFormat },
    max_completion_tokens: maxTokens,
    max_tokens: maxTokens,
    stream: true,
  } as any);

  const result = await collectAudioFromStream(completion as any, requestedFormat);
  const replyText = (result.reply || result.transcript).trim();
  if (!replyText) {
    throw new Error(`Audio model ${model} did not return text output.`);
  }
  if (!result.audioBuffer.length) {
    throw new Error(`Audio model ${model} did not return audio output.`);
  }

  const audioUrl =
    result.audioFormat === "pcm16"
      ? pcm16BufferToWavDataUrl(result.audioBuffer)
      : `data:audio/${result.audioFormat};base64,${result.audioBuffer.toString("base64")}`;

  return {
    reply: replyText,
    audioUrl,
    provider,
    model,
  };
};
