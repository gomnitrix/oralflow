import { Buffer } from "buffer";
import { NextResponse } from "next/server";
import { toFile } from "openai/uploads";

import { runConversationTurn } from "../../../../services/ai/conversation-model";
import { AIClient, type ChatMessage } from "../../../../services/ai/client";
import { stwStartRequestSchema, stwReplyRequestSchema, stwCopilotRequestSchema, stwTranscribeRequestSchema } from "../../../../lib/validation/conversation";
import { runDistill } from "../../../../domains/copilot/distill-service";
import { runInspirationBurst } from "../../../../domains/copilot/inspiration-service";
import { SettingsService, type AssignmentCapability } from "../../../../services/ai/settings";
import { synthesizePlaceholderSpeech } from "../../../../lib/audio/placeholder";
import { synthesizeSpeech } from "../../../../services/ai/tts";
import { createOpenAIClient, resolveModelForCapability } from "../../../../services/ai/model-routing";
import type { ProviderType } from "../../../../services/ai/provider-manager";

export const runtime = "nodejs";
const settings = SettingsService.getInstance();

const getAssignment = (capability: AssignmentCapability): string | null => {
  return settings.getSettings().assignments[capability] ?? null;
};

const cleanBase64Audio = (audioBase64: string): string => {
  if (!audioBase64) return "";
  const [, base64] = audioBase64.split(",");
  return (base64 || audioBase64).trim();
};

const buildSystemPrompt = (input: {
  title: string;
  learnerRole?: string | null;
  aiRole?: string | null;
  mainGoal?: string | null;
  subGoals?: string[] | null;
  description?: string | null;
}) => {
  const parts = [
    `You are role-playing as ${input.aiRole || "a helpful partner"} in a language practice scenario titled "${input.title}".`,
    input.description ? `Scenario background: ${input.description}` : null,
    input.mainGoal ? `Primary goal: ${input.mainGoal}` : null,
    input.subGoals && input.subGoals.length ? `Sub-goals: ${input.subGoals.join("; ")}` : null,
    `The learner is acting as ${input.learnerRole || "the learner"}. Keep replies concise, supportive, and on-topic.`,
  ].filter(Boolean);

  return parts.join("\n");
};

const mapHistoryToMessages = (history: { speaker: "user" | "ai"; text: string }[]): ChatMessage[] =>
  history.map((entry) => ({
    role: entry.speaker === "ai" ? "assistant" : "user",
    content: entry.text,
  }));

const ttsForText = async (text: string): Promise<string | null> => {
  if (!text.trim()) return null;
  try {
    const result = await synthesizeSpeech(text, "stw_tts");
    return result.audioUrl;
  } catch (error) {
    console.error("TTS fallback invoked:", error);
    return synthesizePlaceholderSpeech(text, { modelId: getAssignment("stw_tts") ?? undefined });
  }
};

async function handleStart(payload: unknown) {
  const parsed = stwStartRequestSchema.parse(payload);
  const client = new AIClient();
  const systemPrompt = buildSystemPrompt(parsed.scenario);

  const turn = await runConversationTurn(
    client,
    {
      systemPrompt,
      userText: `Start this conversation with a concise greeting and invite the learner to speak. Scenario: ${parsed.scenario.title}.`,
    },
    "stw_chat"
  );

  return {
    reply: turn.reply,
    provider: turn.provider,
    modelId: getAssignment("stw_chat"),
    audioUrl: await ttsForText(turn.reply),
  };
}

async function handleReply(payload: unknown) {
  const parsed = stwReplyRequestSchema.parse(payload);
  const client = new AIClient();
  const systemPrompt = buildSystemPrompt(parsed.scenario);

  const turn = await runConversationTurn(
    client,
    {
      systemPrompt,
      history: mapHistoryToMessages(parsed.history),
      userText: parsed.userText,
    },
    "stw_chat"
  );

  return {
    reply: turn.reply,
    provider: turn.provider,
    modelId: getAssignment("stw_chat"),
    audioUrl: await ttsForText(turn.reply),
  };
}

async function handleCopilot(payload: unknown) {
  const parsed = stwCopilotRequestSchema.parse(payload);
  const client = new AIClient();

  if (parsed.type === "distill") {
    const insight = await runDistill(client, { bubbleId: parsed.bubbleId, transcript: parsed.bubbleText });
    return { insight, modelId: getAssignment("copilot_distill") };
  }

  const insight = await runInspirationBurst(client, {
    bubbleId: parsed.bubbleId,
    topic: parsed.topic || parsed.bubbleText,
    history: parsed.history ?? [],
  });

  return { insight, modelId: getAssignment("copilot_inspiration") };
}

async function transcribeWithOpenAI(audioBase64: string, mimeType?: string | null, hint?: string | null) {
  const normalized = cleanBase64Audio(audioBase64);
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.byteLength) {
    console.error("[stw:transcribe] empty audio buffer");
    throw new Error("Invalid audio payload for transcription.");
  }

  const fileType = mimeType || "audio/webm";
  const extension = fileType.includes("wav") ? "wav" : fileType.includes("mp3") ? "mp3" : "webm";

  const file = await toFile(buffer, `speech.${extension}`, { type: fileType });
  const tryTranscribe = async (providerId: ProviderType, modelId: string) => {
    const client = createOpenAIClient(providerId);
    console.log("[stw:transcribe] request", {
      provider: providerId,
      model: modelId,
      mimeType: fileType,
      size: buffer.byteLength,
      hintPreview: hint ? `${hint.slice(0, 40)}${hint.length > 40 ? "…" : ""}` : null,
    });
    const transcription = await client.audio.transcriptions.create({
      file,
      model: modelId,
      ...(hint ? { prompt: hint } : {}),
    });
    const text = transcription.text?.trim() ?? "";
    if (!text) {
      throw new Error("Empty transcript returned from STT model.");
    }
    return { text, modelId, providerId };
  };

  const { provider, model } = resolveModelForCapability("stw_stt", { categoryOverride: "stt", fallbackModel: "whisper-1" });

  try {
    return await tryTranscribe(provider, model);
  } catch (primaryErr) {
    const status = (primaryErr as any)?.status ?? (primaryErr as any)?.response?.status;
    const canFallbackToOpenAI = provider !== "openai" && !!process.env.OPENAI_API_KEY;
    if (canFallbackToOpenAI) {
      try {
        console.warn("[stw:transcribe] primary provider failed, falling back to openai", { status, provider, model });
        return await tryTranscribe("openai", "whisper-1");
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw primaryErr;
  }
}

async function handleTranscribe(payload: unknown) {
  const parsed = stwTranscribeRequestSchema.parse(payload);

  try {
    const transcription = await transcribeWithOpenAI(parsed.audioBase64, parsed.mimeType, parsed.hint);
    if (!transcription.text) {
      throw new Error("Empty transcript returned from STT model.");
    }
    return { text: transcription.text, modelId: transcription.modelId };
  } catch (error) {
    const errObj = error as any;
    console.error("[stw:transcribe] failed", {
      error: errObj?.message,
      mimeType: parsed.mimeType,
      size: parsed.audioBase64?.length ?? 0,
      status: errObj?.status,
      cause: errObj?.cause,
      response: errObj?.response ? { status: errObj.response?.status, data: errObj.response?.data } : undefined,
      provider: errObj?.providerId,
    });
    const fallback = "";
    let modelId = getAssignment("stw_stt");
    if (!modelId) {
      try {
        modelId = resolveModelForCapability("stw_stt", { categoryOverride: "stt", fallbackModel: "whisper-1" }).model;
      } catch {
        modelId = null;
      }
    }
    const message = (error as Error).message || "STT failed";
    return { text: fallback, modelId, warning: `${message}${modelId ? ` (model: ${modelId})` : ""}` };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "start") {
      const result = await handleStart(body);
      return NextResponse.json(result);
    }

    if (action === "reply") {
      const result = await handleReply(body);
      return NextResponse.json(result);
    }

    if (action === "copilot") {
      const result = await handleCopilot(body);
      return NextResponse.json(result);
    }

    if (action === "transcribe") {
      const result = await handleTranscribe(body);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
