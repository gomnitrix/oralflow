import { NextResponse } from "next/server";
import { expressionSuggestionSchema } from "../../../../lib/validation/notes";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { NotebookService } from "../../../../domains/notes/notebook-service";
import { AIClient } from "../../../../services/ai/client";
import { CardGeneratorService } from "../../../../domains/training/card-generator";
import type { CardType } from "../../../../domains/training/models";
import type { NotebookItem } from "../../../../domains/notes/models";

const repositories = createServerRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });
const cardGenerator = new CardGeneratorService({ aiClient: new AIClient() });
const initialCardTypes: CardType[] = [
  "answer_generation",
  "ask_question",
  "translation",
  "read_aloud",
];

const queueInitialCards = (item: NotebookItem) => {
  void cardGenerator
    .generateCards(item, initialCardTypes)
    .then(async (cards) => {
      for (const card of cards) {
        await repositories.reviewCards.upsert(card);
      }
    })
    .catch((error) => {
      console.warn("[training] initial card generation failed", error);
    });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const suggestion = expressionSuggestionSchema.parse(body);
    const existing = await repositories.notebook.list();
    const matched = existing.find(
      (item) => item.phrase.toLowerCase() === suggestion.text.toLowerCase()
    );
    if (matched) {
      return NextResponse.json({ item: matched });
    }
    const item = await notebookService.saveSuggestion(suggestion);
    queueInitialCards(item);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
