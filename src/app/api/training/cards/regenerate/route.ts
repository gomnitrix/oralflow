import { NextRequest, NextResponse } from "next/server";
import { createServerRepositories } from "../../../../../services/persistence/server-repositories";
import { AIClient } from "../../../../../services/ai/client";
import { CardGeneratorService } from "../../../../../domains/training/card-generator";
import { trainingCardSupplementSchema } from "../../../../../lib/validation/training";
import type { CardType } from "../../../../../domains/training/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CARD_TYPES: CardType[] = ["answer_generation", "ask_question", "translation", "read_aloud"];

const pickCardTypes = (count: number): CardType[] => {
    if (!count) return [];
    const selected: CardType[] = [];
    for (let i = 0; i < count; i += 1) {
        selected.push(CARD_TYPES[i % CARD_TYPES.length]);
    }
    return selected;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = trainingCardSupplementSchema.parse(body);
        const notebookItemId = parsed.notebookItemId;
        const count = parsed.count ?? 1;

        if (!notebookItemId) {
            return NextResponse.json({ error: "Missing notebookItemId" }, { status: 400 });
        }

        const repos = createServerRepositories();
        const item = await repos.notebook.getById(notebookItemId);

        if (!item) {
            return NextResponse.json({ error: "Notebook item not found" }, { status: 404 });
        }

        const aiClient = new AIClient();
        const generator = new CardGeneratorService({ aiClient });

        const typesToGenerate = pickCardTypes(count);

        const newCards = await generator.generateCards(item, typesToGenerate);

        // Save cards
        for (const card of newCards) {
            await repos.reviewCards.upsert(card);
        }

        return NextResponse.json({ cards: newCards });
    } catch (error) {
        console.error("Failed to regenerate cards:", error);
        return NextResponse.json({ error: "Failed to regenerate cards" }, { status: 500 });
    }
}
