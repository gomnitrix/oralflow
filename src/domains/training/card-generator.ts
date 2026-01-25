import type { NotebookItem } from "../notes/models";
import { AIClient } from "../../services/ai/client";
import {
  createReviewCard,
  type CardType,
  type ReviewCard,
  type ReviewCardContent,
  type ReviewCardMetadata,
} from "./models";

const cardTitles: Record<CardType, string> = {
  answer_generation: "Answer Generation",
  ask_question: "Ask a Question",
  translation: "Translation",
  read_aloud: "Read Aloud",
};

const pickExample = (item: NotebookItem): string => {
  if (item.contextSentence) return item.contextSentence;
  if (item.exampleSentences.length) return item.exampleSentences[0];
  return item.phrase;
};

const buildFallbackContent = (item: NotebookItem, type: CardType): ReviewCardContent => {
  const example = pickExample(item);
  const meaning = item.meaning || example;
  switch (type) {
    case "translation":
      return {
        frontContent: {
          context: meaning,
          task: "Translate the sentence.",
          cue: item.phrase,
        },
        backContent: {
          referenceAnswer: example || item.phrase,
        },
      };
    case "read_aloud":
      return {
        frontContent: {
          context: example,
          task: "Read the sentence aloud.",
          cue: item.phrase,
        },
        backContent: {
          referenceAnswer: example,
        },
      };
    case "ask_question":
      return {
        frontContent: {
          context: example,
          task: "Ask a question using the cue.",
          cue: item.phrase,
        },
        backContent: {
          referenceAnswer: example,
        },
      };
    case "answer_generation":
    default:
      return {
        frontContent: {
          context: example,
          task: "Respond naturally using the cue.",
          cue: item.phrase,
        },
        backContent: {
          referenceAnswer: example,
        },
      };
  }
};

const buildSystemPrompt = (type: CardType, phrase: string): string => {
  const base = [
    `You are an English teaching assistant. Generate a practice card for the target phrase: "${phrase}".`,
    "Output format: Strictly valid JSON.",
    "Cue hiding: The task MUST NOT contain the exact target phrase.",
    "Language: Context/task in English, except Translation uses a Chinese context sentence.",
    "Reference answer must contain the target phrase.",
  ];

  switch (type) {
    case "answer_generation":
      return [
        ...base,
        "Type: Answer Generation.",
        "Goal: Create a scenario where the user must use the phrase to respond naturally.",
        "Output JSON structure:",
        `{
  "type": "answer_generation",
  "frontContent": {
    "context": "Brief situation description (1-2 sentences).",
    "task": "Instruction for the user. MUST hint at the phrase's meaning/metaphor but NOT contain the phrase itself.",
    "cue": "${phrase}"
  },
  "backContent": {
    "referenceAnswer": "A natural response sentence containing the phrase."
  }
}`,
      ].join("\n");
    case "ask_question":
      return [
        ...base,
        "Type: Ask a Question.",
        "Goal: Create a scenario where the user must use the phrase to ask a question or make a request.",
        "Output JSON structure:",
        `{
  "type": "ask_question",
  "frontContent": {
    "context": "Brief situation description.",
    "task": "Instruction to ask a question. MUST hint at the phrase's meaning but NOT contain the phrase itself.",
    "cue": "${phrase}"
  },
  "backContent": {
    "referenceAnswer": "A natural question containing the phrase."
  }
}`,
      ].join("\n");
    case "translation":
      return [
        ...base,
        "Type: Translation.",
        "Goal: Translate a Chinese sentence that perfectly maps to the target phrase.",
        "Output JSON structure:",
        `{
  "type": "translation",
  "frontContent": {
    "context": "Chinese sentence to translate.",
    "task": "Translate the sentence.",
    "cue": "${phrase}"
  },
  "backContent": {
    "referenceAnswer": "The English translation containing the phrase."
  }
}`,
      ].join("\n");
    case "read_aloud":
      return [
        ...base,
        "Type: Read Aloud.",
        "Goal: Provide a natural sentence containing the phrase for pronunciation practice.",
        "Output JSON structure:",
        `{
  "type": "read_aloud",
  "frontContent": {
    "context": "A natural sentence containing the phrase.",
    "task": "Read the sentence aloud.",
    "cue": "${phrase}"
  },
  "backContent": {
    "referenceAnswer": "Same as context."
  }
}`,
      ].join("\n");
    default:
      return base.join("\n");
  }
};

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

const normalizeContent = (
  raw: unknown,
  fallback: ReviewCardContent,
  phrase: string
): ReviewCardContent => {
  if (!raw || typeof raw !== "object") return fallback;
  const payload = raw as Record<string, any>;

  const candidateFront = payload.frontContent ?? payload.front ?? fallback.frontContent;
  const candidateBack = payload.backContent ?? payload.back ?? fallback.backContent;

  const context =
    candidateFront?.context ??
    candidateFront?.prompt ??
    fallback.frontContent.context;
  const rawTask =
    candidateFront?.task ??
    candidateFront?.prompt ??
    fallback.frontContent.task;
  const cue = candidateFront?.cue ?? phrase ?? fallback.frontContent.cue;
  const referenceAnswer = candidateBack?.referenceAnswer ?? fallback.backContent.referenceAnswer;

  const normalizedTask = typeof rawTask === "string" ? rawTask : fallback.frontContent.task;
  const safeTask = normalizedTask.toLowerCase().includes(phrase.toLowerCase())
    ? fallback.frontContent.task
    : normalizedTask;

  return {
    frontContent: {
      context: typeof context === "string" ? context : fallback.frontContent.context,
      task: safeTask,
      cue: typeof cue === "string" && cue.trim() ? cue : fallback.frontContent.cue,
    },
    backContent: {
      referenceAnswer: typeof referenceAnswer === "string" && referenceAnswer.trim()
        ? referenceAnswer
        : fallback.backContent.referenceAnswer,
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
    const systemPrompt = buildSystemPrompt(type, item.phrase);
    const userPrompt = buildUserPrompt(item, type);
    let content = fallback;

    try {
      const completion = await this.deps.aiClient.completeChat(
        {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
        },
        "training_generator"
      );
      const cleaned = completion.message.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      content = normalizeContent(parsed, fallback, item.phrase);
    } catch (error) {
      console.warn("[training] card generator fallback", error);
    }

    const metadata: ReviewCardMetadata = {
      locale: item.locale ?? "en",
      source: "generated",
      tags: item.tags ?? [],
      debug: {
        systemPrompt,
        userPrompt,
      },
    };

    return createReviewCard({
      notebookItemId: item.id,
      type,
      content,
      metadata,
    });
  }
}
