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
  if (content && typeof content === "object" && !Array.isArray(content)) {
    if (typeof content.text === "string") return content.text;
    if (typeof content.input_text === "string") return content.input_text;
    if (typeof content.transcript === "string") {
      fallbackTranscript.push(content.transcript);
    }
    return "";
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.input_text === "string") return part.input_text;
        if (typeof part?.transcript === "string") {
          fallbackTranscript.push(part.transcript);
        }
        return "";
      })
      .join("");
  }
  return "";
};

const ingestAudioPayload = (
  audio: any,
  audioBuffers: Buffer[],
  transcriptParts: string[],
  setFormat: (format: string) => void
) => {
  if (!audio) return;
  if (audio.data) {
    audioBuffers.push(Buffer.from(audio.data, "base64"));
  }
  if (audio.format) {
    setFormat(audio.format);
  }
  if (typeof audio.transcript === "string") {
    transcriptParts.push(audio.transcript);
  }
};

const ingestContent = (
  content: any,
  audioBuffers: Buffer[],
  transcriptParts: string[],
  replyParts: string[],
  setFormat: (format: string) => void
) => {
  const text = normalizeContentText(content, transcriptParts);
  if (text) {
    replyParts.push(text);
  }

  const parts = Array.isArray(content) ? content : content ? [content] : [];
  for (const part of parts) {
    const audio = part?.audio || part?.output_audio;
    if (audio) {
      ingestAudioPayload(audio, audioBuffers, transcriptParts, setFormat);
    }
  }
};

const collectAudioFromStream = async (
  stream: AsyncIterable<any>,
  requestedFormat: "mp3" | "pcm16",
  debug: boolean
): Promise<{ audioBuffer: Buffer; audioFormat: string; reply: string; transcript: string }> => {
  const audioBuffers: Buffer[] = [];
  let audioFormat: string = requestedFormat;
  const replyParts: string[] = [];
  const transcriptParts: string[] = [];
  let index = 0;

  const summarizeContent = (content: any) => {
    if (typeof content === "string") return { type: "string", length: content.length };
    if (content && typeof content === "object" && !Array.isArray(content)) {
      return { type: "object", keys: Object.keys(content) };
    }
    if (Array.isArray(content)) {
      return {
        type: "array",
        length: content.length,
        partTypes: content.map((part) => part?.type || typeof part),
      };
    }
    return { type: typeof content };
  };

  const summarizeAudio = (audio: any) => {
    if (!audio) return null;
    return {
      format: audio.format,
      dataLength: typeof audio.data === "string" ? audio.data.length : 0,
      transcriptLength: typeof audio.transcript === "string" ? audio.transcript.length : 0,
    };
  };

  for await (const chunk of stream) {
    const choice = chunk?.choices?.[0] as any;
    const delta = choice?.delta as any;
    const message = choice?.message as any;

    if (delta) {
      ingestAudioPayload(delta.audio || delta.output_audio, audioBuffers, transcriptParts, (format) => {
        audioFormat = format;
      });

      if (typeof delta.text === "string") {
        replyParts.push(delta.text);
      }
      if (typeof delta.transcript === "string") {
        transcriptParts.push(delta.transcript);
      }
      if (typeof delta.audio_transcript === "string") {
        transcriptParts.push(delta.audio_transcript);
      }

      ingestContent(delta.content, audioBuffers, transcriptParts, replyParts, (format) => {
        audioFormat = format;
      });
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

      if (!hasText || !hasTranscript || !hasAudio) {
        ingestContent(message.content, audioBuffers, transcriptParts, replyParts, (format) => {
          audioFormat = format;
        });
      }
    }

    if (debug) {
      console.log("[stw:audio] chunk", {
        index,
        hasDelta: !!delta,
        hasMessage: !!message,
        deltaKeys: delta ? Object.keys(delta) : [],
        messageKeys: message ? Object.keys(message) : [],
        deltaContent: summarizeContent(delta?.content),
        messageContent: summarizeContent(message?.content),
        deltaAudio: summarizeAudio(delta?.audio || delta?.output_audio),
        messageAudio: summarizeAudio(message?.audio || message?.output_audio),
      });
    }

    index += 1;
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
  const debug = provider === "openrouter";

  const messages = prompt.messages.map((message) => ({
    role: message.role,
    content: [{ type: "text", text: message.content }],
  }));

  const requestPayload = {
    model,
    messages,
    temperature: prompt.temperature ?? 0.4,
    modalities: ["text", "audio"],
    audio: { voice: "alloy", format: requestedFormat },
    max_completion_tokens: maxTokens,
    max_tokens: maxTokens,
    stream: true,
  } as const;

  if (debug) {
    console.log("[stw:audio] request", JSON.stringify(requestPayload));
  }

  const completion = await client.chat.completions.create(requestPayload as any);

  const result = await collectAudioFromStream(completion as any, requestedFormat, debug);
  const replyText = (result.reply || result.transcript).trim();
  if (!replyText) {
    if (debug) {
      console.log("[stw:audio] no text output", {
        replyLength: result.reply.length,
        transcriptLength: result.transcript.length,
        audioBytes: result.audioBuffer.length,
        audioFormat: result.audioFormat,
      });
    }
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
