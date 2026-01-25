import { NextResponse } from "next/server";
import { trainingCardEvaluateSchema } from "@/lib/validation/training";
import { createServerRepositories } from "@/services/persistence/server-repositories";
import { AIClient } from "@/services/ai/client";
import { CardEvaluatorService } from "@/domains/training/card-evaluator";

const repositories = createServerRepositories();
const evaluator = new CardEvaluatorService({ aiClient: new AIClient() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingCardEvaluateSchema.parse(body);
    const card = await repositories.reviewCards.getById(parsed.cardId as string);
    if (!card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }
    const item = await repositories.notebook.getById(card.notebookItemId);
    const evaluation = await evaluator.evaluate(card, parsed.answerText ?? "", item);
    return NextResponse.json({ evaluation });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
