import { NextResponse } from "next/server";
import { AIClient } from "../../../../services/ai/client";
import { evaluateUtterance } from "../../../../services/ai/evaluation-model";
import { stwEvaluateRequestSchema } from "../../../../lib/validation/conversation";
import { createInMemoryRepositories } from "../../../../services/persistence/repositories";

const repositories = createInMemoryRepositories();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = stwEvaluateRequestSchema.parse(body);

    const client = new AIClient();
    const evaluation = await evaluateUtterance(client, {
      bubbleId: parsed.bubbleId,
      text: parsed.text,
      audioUrl: parsed.audioUrl,
      mode: "stw",
    });

    await repositories.evaluationRecords.upsert(evaluation.record);

    return NextResponse.json({
      evaluationId: evaluation.record.id,
      pronunciationIssues: evaluation.record.pronunciationIssues,
      grammarIssues: evaluation.record.grammarIssues,
      naturalnessNotes: evaluation.record.naturalnessNotes,
      nativeLikeSuggestion: evaluation.record.nativeLikeSuggestion,
      referenceAudioUrl: evaluation.record.referenceAudioUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
