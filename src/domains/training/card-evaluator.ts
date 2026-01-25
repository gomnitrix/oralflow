import { AIClient } from "../../services/ai/client";
import type { NotebookItem } from "../notes/models";
import type { ReviewCard } from "./models";

export interface CardEvaluation {
  isCorrect: boolean;
  feedback: string;
  corrections: string[];
  referenceAnswer: string;
}

export interface CardEvaluationResult extends CardEvaluation {
  provider: string;
  model: string;
  debug?: {
    systemPrompt: string;
    userPrompt: string;
    rawResponse?: string;
  };
}

const buildSystemPrompt = () => [
  "You are a strict but encouraging language tutor.",
  "Evaluate the learner answer against the reference answer.",
  "Return ONLY JSON with:",
  `{
    "isCorrect": boolean,
    "feedback": "string",
    "corrections": ["string"]
  }`,
  "Keep feedback concise and actionable.",
].join("\n");

const buildUserPrompt = (card: ReviewCard, answerText: string, item?: NotebookItem | null) => [
  `Card type: ${card.type}`,
  `Context: ${card.content.frontContent.context}`,
  `Task: ${card.content.frontContent.task}`,
  `Cue: ${card.content.frontContent.cue}`,
  `Reference answer: ${card.content.backContent.referenceAnswer}`,
  `Learner answer: ${answerText || "(empty)"}`,
  item
    ? `Notebook notes: ${item.usageNotes || "N/A"} | Examples: ${(item.exampleSentences || []).join(" | ") || "N/A"}`
    : "",
].filter(Boolean).join("\n");

const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

const similarityScore = (a: string, b: string) => {
  if (!a || !b) return 0;
  const aTokens = new Set(a.split(/\s+/));
  const bTokens = new Set(b.split(/\s+/));
  const intersection = [...aTokens].filter((token) => bTokens.has(token));
  return intersection.length / Math.max(1, Math.max(aTokens.size, bTokens.size));
};

export interface CardEvaluatorDeps {
  aiClient: AIClient;
}

export class CardEvaluatorService {
  constructor(private readonly deps: CardEvaluatorDeps) { }

  async evaluate(
    card: ReviewCard,
    answerText: string,
    item?: NotebookItem | null,
    options?: { includeDebug?: boolean }
  ): Promise<CardEvaluationResult> {
    const reference = card.content.backContent.referenceAnswer;
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(card, answerText, item);
    try {
      const completion = await this.deps.aiClient.completeChat(
        {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        },
        "training_evaluator"
      );
      const cleaned = completion.message.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as Partial<CardEvaluation>;
      const isCorrect = typeof parsed.isCorrect === "boolean" ? parsed.isCorrect : false;
      const result: CardEvaluationResult = {
        isCorrect,
        feedback: parsed.feedback || "Review the reference answer and try again.",
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections.filter(Boolean) : [],
        referenceAnswer: reference,
        provider: completion.provider,
        model: completion.model,
      };
      if (options?.includeDebug) {
        result.debug = { systemPrompt, userPrompt, rawResponse: completion.message };
      }
      return result;
    } catch (error) {
      const normalizedAnswer = normalizeText(answerText || "");
      const normalizedReference = normalizeText(reference || "");
      const sim = similarityScore(normalizedAnswer, normalizedReference);
      const isCorrect = sim >= 0.6;
      const result: CardEvaluationResult = {
        isCorrect,
        feedback: isCorrect
          ? "Nice work! Your answer matches the reference closely."
          : "Compare your answer with the reference and focus on key phrasing.",
        corrections: isCorrect ? [] : [reference],
        referenceAnswer: reference,
        provider: "fallback",
        model: "heuristic",
      };
      if (options?.includeDebug) {
        result.debug = { systemPrompt, userPrompt, rawResponse: "" };
      }
      return result;
    }
  }
}
