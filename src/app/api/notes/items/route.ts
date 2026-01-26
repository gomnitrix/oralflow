import { NextResponse } from "next/server";
import { notebookItemSchema } from "../../../../lib/validation/notes";
import { NotebookRepository } from "../../../../services/persistence/repositories";
import { NotebookService } from "../../../../domains/notes/notebook-service";
import { createNotebookItem } from "../../../../domains/notes/models";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { AIClient } from "../../../../services/ai/client";
import { CardGeneratorService } from "../../../../domains/training/card-generator";
import type { CardType } from "../../../../domains/training/models";
import type { NotebookItem } from "../../../../domains/notes/models";

const repositories = createServerRepositories();
const notebookRepo: NotebookRepository = repositories.notebook;
const notebookService = new NotebookService({ repository: notebookRepo });
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

export async function GET() {
  const items = await notebookService.list();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = notebookItemSchema.parse(body);
    const item = createNotebookItem(parsed);
    const existing = await notebookRepo.getById(item.id);
    await notebookRepo.upsert(item);
    if (!existing) {
      queueInitialCards(item);
    }
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await notebookService.delete(id);
  return new NextResponse(null, { status: 204 });
}
