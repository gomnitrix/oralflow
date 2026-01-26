import { Buffer } from "buffer";
import { NextResponse } from "next/server";
import { toFile } from "openai/uploads";
import { trainingCardEvaluateSchema } from "@/lib/validation/training";
import { createServerRepositories } from "@/services/persistence/server-repositories";
import { AIClient } from "@/services/ai/client";
import { createOpenAIClient, resolveModelForCapability } from "@/services/ai/model-routing";
import { ProviderManager } from "@/services/ai/provider-manager";
import { extractTextFromMessage } from "@/services/ai/message-normalizer";
import { CardEvaluatorService } from "@/domains/training/card-evaluator";
import { evaluatePronunciation } from "@/domains/evaluation/pronunciation-service";
import { SettingsService } from "@/services/ai/settings";

const repositories = createServerRepositories();
const evaluator = new CardEvaluatorService({ aiClient: new AIClient() });
const pronunciationCache = new Map<string, { score: number; feedback: string; passed: boolean }>();

export const runtime = "nodejs";

const cleanBase64Audio = (audioBase64: string): string => {
  if (!audioBase64) return "";
  const [, base64] = audioBase64.split(",");
  return (base64 || audioBase64).trim();
};

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

const transcribeAudio = async (audioBase64: string, mimeType?: string | null) => {
  const normalized = cleanBase64Audio(audioBase64);
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.byteLength) {
    throw new Error("Invalid audio payload for transcription.");
  }

  const { provider, model } = resolveModelForCapability("stw_stt", { categoryOverride: "stt", fallbackModel: "whisper-1" });
  const fileType = mimeType || "audio/webm";
  const providerInfo = ProviderManager.getInstance().getProvider(provider);
  const client = createOpenAIClient(provider);

  if (providerInfo?.id === "openai") {
    try {
      const extension =
        fileType.includes("wav")
          ? "wav"
          : fileType.includes("mp3")
            ? "mp3"
            : fileType.includes("ogg")
              ? "ogg"
              : "webm";
      const file = await toFile(buffer, `speech.${extension}`, { type: fileType });
      const transcription = await client.audio.transcriptions.create({
        file,
        model,
      });
      const rawText = transcription.text ?? "";
      const text = sanitizeTranscript(rawText, provider, model);
      return { text, modelId: model };
    } catch (error) {
      console.warn("[training:transcribe] openai transcription failed, falling back to chat", error);
    }
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
  const text = sanitizeTranscript(rawText, provider, model);
  return { text, modelId: model };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingCardEvaluateSchema.parse(body);
    const card = await repositories.reviewCards.getById(parsed.cardId as string);
    if (!card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }
    const item = await repositories.notebook.getById(card.notebookItemId);

    if (card.type === "read_aloud") {
      const cached = pronunciationCache.get(card.id);
      if (!cached && !parsed.audioBase64 && !parsed.audioUrl) {
        return NextResponse.json({ error: "Missing pronunciation audio for read-aloud card." }, { status: 400 });
      }

      let evaluationPayload = cached;
      if (!evaluationPayload) {
        const pronunciation = await evaluatePronunciation({
          bubbleId: card.id,
          text: card.content.backContent.referenceAnswer,
          audioUrl: parsed.audioUrl ?? undefined,
          audioBase64: parsed.audioBase64 ?? undefined,
          audioMimeType: parsed.audioMimeType ?? undefined,
        });

        if (!pronunciation.enabled) {
          evaluationPayload = {
            score: 0,
            passed: true,
            feedback: "Pronunciation scoring is unavailable. Skipping read-aloud evaluation.",
          };
        } else {
          const score = Math.round(pronunciation.record.pronunciationScores?.overall ?? 0);
          const threshold = SettingsService.getInstance().getSettings().config.training.readAloudPassScore;
          const passed = score >= threshold;
          const feedback = pronunciation.record.pronunciationIssues?.length
            ? pronunciation.record.pronunciationIssues.join(" ")
            : passed
              ? "Nice pronunciation! You're ready to move on."
              : "Try again and focus on clarity and rhythm.";
          evaluationPayload = { score, passed, feedback };
        }
        pronunciationCache.set(card.id, evaluationPayload);
      }

      return NextResponse.json({
        evaluation: {
          isCorrect: evaluationPayload.passed,
          feedback: evaluationPayload.feedback,
          corrections: [],
          referenceAnswer: card.content.backContent.referenceAnswer,
          pronunciationScore: evaluationPayload.score,
          pronunciationPassed: evaluationPayload.passed,
        },
      });
    }

    let answerText = parsed.answerText ?? "";
    if (!answerText && parsed.audioBase64) {
      const transcription = await transcribeAudio(parsed.audioBase64, parsed.audioMimeType ?? undefined);
      answerText = transcription.text;
    }

    if (!answerText) {
      return NextResponse.json(
        { error: "Missing answer text or audio for evaluation." },
        { status: 400 }
      );
    }

    const evaluation = await evaluator.evaluate(card, answerText, item, {
      includeDebug: parsed.debug ?? false,
    });
    return NextResponse.json({ evaluation });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
