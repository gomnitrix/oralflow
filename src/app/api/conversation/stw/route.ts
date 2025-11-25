import { NextResponse } from "next/server";

import { runConversationTurn } from "../../../../services/ai/conversation-model";
import { AIClient, type ChatMessage } from "../../../../services/ai/client";
import { stwStartRequestSchema, stwReplyRequestSchema, stwCopilotRequestSchema, stwTranscribeRequestSchema } from "../../../../lib/validation/conversation";
import { runDistill } from "../../../../domains/copilot/distill-service";
import { runInspirationBurst } from "../../../../domains/copilot/inspiration-service";
import { SettingsService, type AssignmentCapability } from "../../../../services/ai/settings";
import { synthesizePlaceholderSpeech } from "../../../../lib/audio/placeholder";
import { synthesizeSpeech } from "../../../../services/ai/tts";

const settings = SettingsService.getInstance();

const getAssignment = (capability: AssignmentCapability): string | null => {
  return settings.getSettings().assignments[capability] ?? null;
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

async function handleTranscribe(payload: unknown) {
  const parsed = stwTranscribeRequestSchema.parse(payload);
  const client = new AIClient();

  // Avoid sending very long payloads to the model by truncating the base64 sample.
  const audioSnippet = parsed.audioBase64.slice(0, 4000);

  try {
    const completion = await client.completeChat(
      {
        messages: [
          { role: "system", content: "You are a speech-to-text engine. Return only the clean transcript." },
          {
            role: "user",
            content: `Audio (base64 ${parsed.mimeType || "audio/webm"}, truncated): ${audioSnippet}`,
          },
          parsed.hint
            ? { role: "user", content: `Context: ${parsed.hint}` }
            : { role: "user", content: "If the audio is unclear, provide your best guess." },
        ],
      },
      "stw_stt"
    );

    return { text: completion.message.trim(), modelId: getAssignment("stw_stt") };
  } catch (error) {
    const fallback = parsed.hint || "Recorded response";
    return { text: fallback, modelId: getAssignment("stw_stt"), warning: (error as Error).message };
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
