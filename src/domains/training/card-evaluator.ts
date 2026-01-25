import { AIClient } from "../../services/ai/client";
import type { NotebookItem } from "../notes/models";
import type { ReviewCard } from "./models";

export interface CardEvaluation {
  score: number;
  feedback: string;
  corrections: string[];
  isCorrect: boolean;
  referenceAnswer: string;
}

export interface CardEvaluationResult extends CardEvaluation {
  provider: string;
  model: string;
}

const buildSystemPrompt = () => [
  "You are a strict but encouraging language tutor.",
  "Evaluate the learner answer against the reference answer.",
  "Return ONLY JSON with:",
  `{
    "score": number (0-100),
    "isCorrect": boolean,
    "feedback": "string",
    "corrections": ["string"]
  }`,
  "Keep feedback concise and actionable.",
].join("\n");

const buildUserPrompt = (card: ReviewCard, answerText: string, item?: NotebookItem | null) => [
  `Card type: ${card.type}`,
  `Prompt: ${card.content.front.prompt}`,
  `Cue: ${card.content.front.cue ?? ""}`,
  `Reference answer: ${card.content.back.referenceAnswer}`,
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

  async evaluate(card: ReviewCard, answerText: string, item?: NotebookItem | null): Promise<CardEvaluationResult> {
    const reference = card.content.back.referenceAnswer;
    try {
      const completion = await this.deps.aiClient.completeChat(
        {
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(card, answerText, item) },
          ],
          temperature: 0.3,
        },
        "training_evaluator"
      );
      const cleaned = completion.message.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as Partial<CardEvaluation>;
      const score = typeof parsed.score === "number" ? parsed.score : 0;
      const isCorrect = typeof parsed.isCorrect === "boolean" ? parsed.isCorrect : score >= 70;
      return {
        score,
        isCorrect,
        feedback: parsed.feedback || "Review the reference answer and try again.",
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections.filter(Boolean) : [],
        referenceAnswer: reference,
        provider: completion.provider,
        model: completion.model,
      };
    } catch (error) {
      const normalizedAnswer = normalizeText(answerText || "");
      const normalizedReference = normalizeText(reference || "");
      const sim = similarityScore(normalizedAnswer, normalizedReference);
      const isCorrect = sim >= 0.6;
      return {
        score: Math.round(sim * 100),
        isCorrect,
        feedback: isCorrect
          ? "Nice work! Your answer matches the reference closely."
          : "Compare your answer with the reference and focus on key phrasing.",
        corrections: isCorrect ? [] : [reference],
        referenceAnswer: reference,
        provider: "fallback",
        model: "heuristic",
      };
    }
  }
}
