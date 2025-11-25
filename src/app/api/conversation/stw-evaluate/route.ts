import { NextResponse } from "next/server";
import { AIClient } from "../../../../services/ai/client";
import { evaluateUtterance } from "../../../../services/ai/evaluation-model";
import { stwEvaluateRequestSchema } from "../../../../lib/validation/conversation";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { evaluatePronunciation } from "../../../../domains/evaluation/pronunciation-service";

const repositories = createServerRepositories();
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = stwEvaluateRequestSchema.parse(body);

    const client = new AIClient();
    const grammarEval = await evaluateUtterance(client, {
      bubbleId: parsed.bubbleId,
      text: parsed.text,
      audioUrl: parsed.audioUrl,
      mode: "stw",
    });

    const pronunciation = await evaluatePronunciation({
      bubbleId: parsed.bubbleId,
      text: parsed.text,
      audioUrl: parsed.audioUrl,
      audioBase64: parsed.audioBase64 ?? undefined,
      audioMimeType: parsed.audioMimeType ?? undefined,
    });

    // Merge results
    const combined = {
      ...grammarEval.record,
      pronunciationIssues: pronunciation.record.pronunciationIssues,
      referenceAudioUrl: pronunciation.record.referenceAudioUrl,
      pronunciationScores: pronunciation.record.pronunciationScores,
      wordScores: pronunciation.record.wordScores,
    };

    await repositories.evaluationRecords.upsert(combined);

    return NextResponse.json({
      evaluationId: combined.id,
      pronunciationIssues: combined.pronunciationIssues,
      grammarIssues: combined.grammarIssues,
      naturalnessNotes: combined.naturalnessNotes,
      nativeLikeSuggestion: combined.nativeLikeSuggestion,
      referenceAudioUrl: combined.referenceAudioUrl,
      pronunciationScores: combined.pronunciationScores,
      wordScores: combined.wordScores,
      pronunciationEnabled: pronunciation.enabled,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
