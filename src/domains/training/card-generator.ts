import type { NotebookItem } from "../notes/models";
import { AIClient } from "../../services/ai/client";
import { createReviewCard, type CardType, type ReviewCard, type ReviewCardContent, type ReviewCardMetadata } from "./models";

const cardTitles: Record<CardType, string> = {
  answer_generation: "Answer Generation",
  ask_question: "Ask a Question",
  translation: "Translate This",
  read_aloud: "Read Aloud",
};

const maskPhrase = (phrase: string): string => {
  return phrase
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return "_".repeat(word.length);
      return `${word[0]}${"_".repeat(word.length - 2)}${word[word.length - 1]}`;
    })
    .join(" ");
};

const buildFallbackContent = (item: NotebookItem, type: CardType): ReviewCardContent => {
  const baseNotes = [item.usageNotes].filter(Boolean);
  const example = item.contextSentence || item.exampleSentences[0] || item.phrase;
  switch (type) {
    case "translation":
      return {
        front: {
          title: cardTitles[type],
          prompt: item.meaning,
          cue: maskPhrase(item.phrase),
          context: item.usageNotes || null,
        },
        back: {
          referenceAnswer: item.phrase,
          notes: baseNotes,
        },
      };
    case "read_aloud":
      return {
        front: {
          title: cardTitles[type],
          prompt: item.phrase,
          cue: item.phrase,
          context: item.contextSentence || null,
        },
        back: {
          referenceAnswer: item.phrase,
          notes: baseNotes,
        },
      };
    case "ask_question":
      return {
        front: {
          title: cardTitles[type],
          prompt: "Ask a question using the hidden cue.",
          cue: maskPhrase(item.phrase),
          context: example,
        },
        back: {
          referenceAnswer: example,
          notes: baseNotes,
        },
      };
    case "answer_generation":
    default:
      return {
        front: {
          title: cardTitles[type],
          prompt: "Respond to the situation using the hidden cue.",
          cue: maskPhrase(item.phrase),
          context: example,
        },
        back: {
          referenceAnswer: example,
          notes: baseNotes,
        },
      };
  }
};

const buildSystemPrompt = (type: CardType) => [
  "You are a language tutor creating practice cards.",
  "Return ONLY JSON with this schema:",
  `{
    "front": { "title": "string", "prompt": "string", "cue": "string", "context": "string" },
    "back": { "referenceAnswer": "string", "notes": ["string", "string"] }
  }`,
  "Make the prompt concise and conversational.",
  "Cue should hide the key phrase with underscores where possible.",
  `Card type: ${type}`,
].join("\n");

const buildUserPrompt = (item: NotebookItem, type: CardType): string => {
  return [
    `Phrase: ${item.phrase}`,
    `Meaning: ${item.meaning}`,
    `Usage notes: ${item.usageNotes || "N/A"}`,
    `Examples: ${(item.exampleSentences || []).join(" | ") || "N/A"}`,
    `Context sentence: ${item.contextSentence || "N/A"}`,
    `Task: ${cardTitles[type]}`,
  ].join("\n");
};

const normalizeContent = (raw: unknown, fallback: ReviewCardContent): ReviewCardContent => {
  if (!raw || typeof raw !== "object") return fallback;
  const content = raw as ReviewCardContent;
  const front = content.front ?? fallback.front;
  const back = content.back ?? fallback.back;
  return {
    front: {
      title: front.title || fallback.front.title,
      prompt: front.prompt || fallback.front.prompt,
      cue: front.cue ?? fallback.front.cue ?? null,
      context: front.context ?? fallback.front.context ?? null,
    },
    back: {
      referenceAnswer: back.referenceAnswer || fallback.back.referenceAnswer,
      notes: Array.isArray(back.notes) && back.notes.length ? back.notes : fallback.back.notes,
    },
  };
};

export interface CardGeneratorDeps {
  aiClient: AIClient;
}

export class CardGeneratorService {
  constructor(private readonly deps: CardGeneratorDeps) { }

  async generateCards(item: NotebookItem, types: CardType[]): Promise<ReviewCard[]> {
    const results: ReviewCard[] = [];
    for (const type of types) {
      results.push(await this.generateCard(item, type));
    }
    return results;
  }

  async generateCard(item: NotebookItem, type: CardType): Promise<ReviewCard> {
    const fallback = buildFallbackContent(item, type);
    let content = fallback;
    try {
      const completion = await this.deps.aiClient.completeChat(
        {
          messages: [
            { role: "system", content: buildSystemPrompt(type) },
            { role: "user", content: buildUserPrompt(item, type) },
          ],
          temperature: 0.5,
        },
        "training_generator"
      );
      const cleaned = completion.message.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      content = normalizeContent(parsed, fallback);
    } catch (error) {
      console.error(`[training] Card generation failed for item ${item.id} (type: ${type}). Using fallback content.`, error);
      // Fallback content is already set to 'fallback' variable
    }

    const metadata: ReviewCardMetadata = {
      locale: item.locale ?? "en",
      source: "generated",
      tags: item.tags ?? [],
    };

    return createReviewCard({
      notebookItemId: item.id,
      type,
      content,
      metadata,
    });
  }
}
