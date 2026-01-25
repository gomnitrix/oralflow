import { NextResponse } from "next/server";
import { trainingCardEvaluateSchema } from "@/lib/validation/training";
import { createServerRepositories } from "@/services/persistence/server-repositories";
import { AIClient } from "@/services/ai/client";
import { CardEvaluatorService } from "@/domains/training/card-evaluator";
import { evaluatePronunciation } from "@/domains/evaluation/pronunciation-service";
import { SettingsService } from "@/services/ai/settings";

const repositories = createServerRepositories();
const evaluator = new CardEvaluatorService({ aiClient: new AIClient() });
const pronunciationCache = new Map<string, { score: number; feedback: string; passed: boolean }>();

export const runtime = "nodejs";

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

    const evaluation = await evaluator.evaluate(card, parsed.answerText ?? "", item, {
      includeDebug: parsed.debug ?? false,
    });
    return NextResponse.json({ evaluation });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
