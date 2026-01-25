import { NextResponse } from "next/server";
import { trainingSessionStartSchema } from "@/lib/validation/training";
import { createServerRepositories } from "@/services/persistence/server-repositories";
import { AIClient } from "@/services/ai/client";
import { CardGeneratorService } from "@/domains/training/card-generator";
import { TrainingSessionService } from "@/domains/training/training-session-service";

const repositories = createServerRepositories();
const generator = new CardGeneratorService({ aiClient: new AIClient() });
const trainingService = new TrainingSessionService({
  notebook: repositories.notebook,
  reviewTasks: repositories.reviewTasks,
  reviewCards: repositories.reviewCards,
  cardGenerator: generator,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingSessionStartSchema.parse(body);

    const summary = await trainingService.buildSummary({
      mode: parsed.mode,
      sourceText: parsed.sourceText ?? null,
      limit: parsed.limit,
      disableNewCards: parsed.disableNewCards ?? false,
    });
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
