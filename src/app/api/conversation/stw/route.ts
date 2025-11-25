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
import { ProviderManager } from "../../../../services/ai/provider-manager";

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

const sanitizeTranscript = (text: string, provider: string, model: string): string => {
  const trimmed = text.trim().replace(/^["“]|["”]$/g, "").trim();
  if (!trimmed) {
    throw new Error(`Empty transcript returned from provider ${provider} (model ${model}).`);
  }
  if (trimmed.toUpperCase().includes("TRANSCRIPTION_UNAVAILABLE")) {
    throw new Error(`Provider ${provider} could not transcribe the audio (model ${model}).`);
  }
  const base64Like = trimmed.match(/[A-Za-z0-9+/=]{120,}/);
  if (base64Like && base64Like[0].length > 200) {
    throw new Error(`Provider ${provider} returned non-text content instead of transcript (model ${model}).`);
  }
  if (trimmed.length > 4000) {
    throw new Error(`Provider ${provider} returned an unusually long response for transcript (model ${model}).`);
  }
  return trimmed;
};

async function transcribeWithOpenAI(audioBase64: string, mimeType?: string | null) {
  const normalized = cleanBase64Audio(audioBase64);
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.byteLength) {
    throw new Error("Invalid audio payload for transcription.");
  }

  const { provider, model } = resolveModelForCapability("stw_stt", { categoryOverride: "stt", fallbackModel: "whisper-1" });
  const fileType = mimeType || "audio/webm";
  const providerInfo = ProviderManager.getInstance().getProvider(provider);

  if (providerInfo?.id === "openai") {
    const extension = fileType.includes("wav") ? "wav" : fileType.includes("mp3") ? "mp3" : "webm";
    const file = await toFile(buffer, `speech.${extension}`, { type: fileType });
    const client = createOpenAIClient(provider);
    const transcription = await client.audio.transcriptions.create({
      file,
      model,
    });
    const text = sanitizeTranscript(transcription.text ?? "", provider, model);
    return { text, modelId: model };
  }

  const format =
    fileType.includes("wav")
      ? "wav"
      : fileType.includes("mp3")
        ? "mp3"
        : fileType.includes("ogg")
          ? "ogg"
          : fileType.includes("webm")
            ? "webm"
            : "wav";

  const client = createOpenAIClient(provider);
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Generate a transcript of the speech." },
          // @ts-expect-error openai sdk typings lag behind multimodal input_audio support for some providers
          { type: "input_audio", input_audio: { data: normalized, format } },
        ],
      },
    ],
    temperature: 0,
  });
  const text = sanitizeTranscript(completion.choices?.[0]?.message?.content ?? "", provider, model);
  return { text, modelId: model };
}

async function handleTranscribe(payload: unknown) {
  const parsed = stwTranscribeRequestSchema.parse(payload);

  const transcription = await transcribeWithOpenAI(parsed.audioBase64, parsed.mimeType);
  if (!transcription.text) {
    throw new Error("Empty transcript returned from STT model.");
  }
  return { text: transcription.text, modelId: transcription.modelId };
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
