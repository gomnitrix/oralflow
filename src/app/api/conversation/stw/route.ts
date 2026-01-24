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
import { extractTextFromMessage } from "../../../../services/ai/message-normalizer";

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
    `The learner is acting as ${input.learnerRole || "the learner"}. Keep replies supportive, on-topic, and conversational.`,
    `Use a natural, conversational speaking style: short turns, simple phrasing, and direct answers. Avoid monologues.`,
  ].filter(Boolean);

  return parts.join("\n");
};

const mapHistoryToMessages = (history: { speaker: "user" | "ai"; text: string }[]): ChatMessage[] =>
  history.map((entry) => ({
    role: entry.speaker === "ai" ? "assistant" : "user",
    content: entry.text,
  }));

const evaluateGoals = async (payload: {
  history: { speaker: "user" | "ai"; text: string }[];
  lastUser?: string;
  lastAi?: string;
  mainGoal?: string | null;
  subGoals?: string[] | null;
}) => {
  const client = new AIClient();
  const { provider, model } = resolveModelForCapability("stw_goal", { categoryOverride: "language" });

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a goal completion evaluator. Return JSON with keys: main_status ("completed"|"in_progress"|"not_started") and subgoals (array of {text,status}). Use ONLY the conversation to decide.`,
    },
    {
      role: "user",
      content: [
        `Main goal: ${payload.mainGoal || "N/A"}`,
        `Sub-goals: ${(payload.subGoals ?? []).join("; ") || "None"}`,
        "Conversation:",
        ...payload.history.map((h) => `${h.speaker === "ai" ? "Assistant" : "User"}: ${h.text}`),
        payload.lastUser ? `User: ${payload.lastUser}` : null,
        payload.lastAi ? `Assistant: ${payload.lastAi}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const completion = await client.completeChat({ messages }, "stw_goal");
  const raw = completion.message.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : raw;

  try {
    const parsed = JSON.parse(candidate);
    const main = typeof parsed.main_status === "string" ? parsed.main_status.toLowerCase() : "not_started";
    const sub = Array.isArray(parsed.subgoals)
      ? parsed.subgoals.map((g: any) => ({
        text: typeof g?.text === "string" ? g.text : "",
        status: typeof g?.status === "string" ? g.status.toLowerCase() : "not_started",
      }))
      : [];

    return {
      mainStatus: main,
      subStatuses: sub,
      provider,
      model,
    };
  } catch (err) {
    console.error("[stw:goal] failed to parse", { raw });
    throw new Error("Goal evaluation failed.");
  }
};

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
    goalStatus: null,
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

  const aiBubbleCount = parsed.history.filter((h) => h.speaker === "ai").length + 1; // include new reply
  const startTurn = (() => {
    const configured = settings.getSettings().config.stw.goalEvaluationStartTurn;
    const asNumber = typeof configured === "number" ? configured : Number(configured);
    if (Number.isFinite(asNumber)) {
      return Math.min(10, Math.max(1, Math.round(asNumber)));
    }
    return 5;
  })();
  const shouldEvaluateGoals = !parsed.skipGoalEvaluation && aiBubbleCount >= startTurn && !!parsed.scenario.mainGoal;

  return {
    reply: turn.reply,
    provider: turn.provider,
    modelId: getAssignment("stw_chat"),
    audioUrl: await ttsForText(turn.reply),
    goalStatus: shouldEvaluateGoals
      ? await (async () => {
        try {
          const history: { speaker: "user" | "ai"; text: string }[] = [
            ...parsed.history.map((h) => ({ speaker: h.speaker, text: h.text })),
            { speaker: "user", text: parsed.userText },
            { speaker: "ai", text: turn.reply },
          ];
          return await evaluateGoals({
            history,
            mainGoal: parsed.scenario.mainGoal,
            subGoals: parsed.scenario.subGoals ?? [],
          });
        } catch (error) {
          console.error("[stw:goal] evaluation error", error);
          return null;
        }
      })()
      : null,
  };
}

async function handleCopilot(payload: unknown) {
  const parsed = stwCopilotRequestSchema.parse(payload);
  const client = new AIClient();

  if (parsed.type === "distill") {
    const insight = await runDistill(client, {
      bubbleId: parsed.bubbleId,
      transcript: parsed.bubbleText,
      difficultyLevel: settings.getSettings().config.copilot.distillLevel,
    });
    return { insight, modelId: getAssignment("copilot_distill") };
  }

  const insight = await runInspirationBurst(client, {
    bubbleId: parsed.bubbleId,
    topic: parsed.topic || parsed.bubbleText,
    history: parsed.history ?? [],
    difficultyLevel: settings.getSettings().config.copilot.inspirationLevel,
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

  const base64Like = trimmed.match(/[A-Za-z0-9+/=_-]{120,}/);
  if (base64Like && base64Like[0].length > 200) {
    throw new Error(`Provider ${provider} returned non-text content instead of transcript (model ${model}).`);
  }
  const hexLike = trimmed.match(/[A-Fa-f0-9]{160,}/);
  if (hexLike && hexLike[0].length > 200) {
    throw new Error(`Provider ${provider} returned binary-like content instead of transcript (model ${model}).`);
  }

  const whitespaceCount = (trimmed.match(/\s/g) || []).length;
  const whitespaceRatio = whitespaceCount / Math.max(trimmed.length, 1);
  if (trimmed.length > 2000 && whitespaceRatio < 0.05) {
    throw new Error(`Provider ${provider} returned non-linguistic content for transcript (model ${model}).`);
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
  const isWebm = fileType.includes("webm");
  if (isWebm) {
    throw new Error("Audio format webm is not supported for transcription. Please record in wav or mp3.");
  }
  const providerInfo = ProviderManager.getInstance().getProvider(provider);

  if (providerInfo?.id === "openai") {
    const extension = fileType.includes("wav") ? "wav" : fileType.includes("mp3") ? "mp3" : "webm";
    const file = await toFile(buffer, `speech.${extension}`, { type: fileType });
    const client = createOpenAIClient(provider);
    console.log("[stw:transcribe] request", { provider, model, mimeType: fileType, size: buffer.byteLength });
    const transcription = await client.audio.transcriptions.create({
      file,
      model,
    });
    const rawText = transcription.text ?? "";
    console.log("[stw:transcribe] response (openai)", {
      provider,
      model,
      textPreview: rawText.slice(0, 200),
      length: rawText.length,
    });
    const text = sanitizeTranscript(rawText, provider, model);
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
  console.log("[stw:transcribe] request", { provider, model, mimeType: fileType, size: buffer.byteLength });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a speech-to-text engine. Return only the transcript." },
      {
        role: "user",
        content: [
          { type: "text", text: "Generate a transcript of the audio." },
          // @ts-expect-error openai sdk typings lag behind multimodal input_audio support for some providers
          { type: "input_audio", input_audio: { data: normalized, format } },
        ],
      },
    ],
    temperature: 0,
  });
  const rawText = extractTextFromMessage(completion.choices?.[0]?.message);
  console.log("[stw:transcribe] response (chat)", {
    provider,
    model,
    textPreview: rawText.slice(0, 200),
    length: rawText.length,
  });
  const text = sanitizeTranscript(rawText, provider, model);
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
