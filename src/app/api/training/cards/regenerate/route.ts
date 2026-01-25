import { NextRequest, NextResponse } from "next/server";
import { createServerRepositories } from "../../../../../services/persistence/server-repositories";
import { AIClient } from "../../../../../services/ai/client";
import { CardGeneratorService } from "../../../../../domains/training/card-generator";
import { CardType } from "../../../../../domains/training/models";

export const dynamic = "force-dynamic";

const CARD_TYPES: CardType[] = ["answer_generation", "ask_question", "translation", "read_aloud"];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { notebookItemId, count = 1 } = body;

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

        // Determine types to generate
        const typesToGenerate: CardType[] = [];
        for (let i = 0; i < count; i++) {
            const randomType = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
            typesToGenerate.push(randomType);
        }

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
