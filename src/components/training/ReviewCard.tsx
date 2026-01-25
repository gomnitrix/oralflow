'use client';

import React from "react";
import type { NotebookItem } from "../../domains/notes/models";
import type { ReviewCard as ReviewCardModel } from "../../domains/training/models";
import { Button } from "../shared/Button";

export interface CardEvaluationSummary {
  isCorrect: boolean;
  feedback: string;
  corrections: string[];
  referenceAnswer: string;
  pronunciationScore?: number;
  pronunciationPassed?: boolean;
  debug?: {
    systemPrompt: string;
    userPrompt: string;
    rawResponse?: string;
  };
}

interface ReviewCardProps {
  card: ReviewCardModel;
  item?: NotebookItem | null;
  answer: string;
  revealed: boolean;
  evaluation?: CardEvaluationSummary | null;
  onAnswerChange: (value: string) => void;
  onReveal: () => void;
  onPlayAudio?: (text: string) => void;
  loading?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  card,
  item,
  answer,
  revealed,
  evaluation,
  onAnswerChange,
  onReveal,
  onPlayAudio,
  loading = false,
}) => {
  const front = card.content.frontContent;
  const back = card.content.backContent;
  const isReadAloud = card.type === "read_aloud";
  const typeLabel = {
    answer_generation: "Answer Generation",
    ask_question: "Ask a Question",
    translation: "Translation",
    read_aloud: "Read Aloud",
  }[card.type];

  const maskCue = (value: string) => {
    if (!value) return "";
    return "*".repeat(Math.max(4, value.length));
  };

  const renderContext = () => {
    if (!front.context) return null;
    if (!isReadAloud || !front.cue) {
      return <p className="text-sm text-custom-text-dark/60">{front.context}</p>;
    }
    const lowerContext = front.context.toLowerCase();
    const lowerCue = front.cue.toLowerCase();
    const idx = lowerContext.indexOf(lowerCue);
    if (idx < 0) {
      return <p className="text-sm text-custom-text-dark/60">{front.context}</p>;
    }
    const before = front.context.slice(0, idx);
    const match = front.context.slice(idx, idx + front.cue.length);
    const after = front.context.slice(idx + front.cue.length);
    return (
      <p className="text-sm text-custom-text-dark/60">
        {before}
        <span className="rounded bg-custom-primary/20 px-1 text-custom-text-dark">{match}</span>
        {after}
      </p>
    );
  };

  return (
    <div className="relative w-full" style={{ perspective: "1400px" }}>
      <div
        className="relative h-[28rem] w-full transition-transform duration-700"
        style={{ transformStyle: "preserve-3d", transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <section
          className="absolute inset-0 rounded-3xl border border-custom-border bg-white p-8 shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="space-y-6 h-full flex flex-col">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Training Card</p>
              <h2 className="text-3xl font-bold text-custom-text-dark">{typeLabel}</h2>
            </div>
            <div className="space-y-3">
              {renderContext()}
              <p className="text-lg text-custom-text-dark">{front.task}</p>
              {front.cue && (
                <div className="inline-flex items-center rounded-full border border-custom-border bg-custom-bg px-3 py-1 text-sm text-custom-text-dark/70">
                  Cue: {maskCue(front.cue)}
                </div>
              )}
            </div>
            <div className="flex-1">
              {isReadAloud ? (
                <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4 text-sm text-custom-text-dark/70">
                  Use the Record button below and read the sentence aloud.
                </div>
              ) : (
                <>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-custom-text-dark/50">
                    Your Answer
                  </label>
                  <textarea
                    className="mt-2 w-full resize-none rounded-2xl border border-custom-border bg-custom-bg/60 p-4 text-sm text-custom-text-dark focus:outline-none focus:ring-2 focus:ring-custom-primary/30"
                    rows={4}
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    placeholder="Type your response..."
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="secondary" onClick={onReveal} disabled={loading}>
                {loading ? "Checking..." : "Show Answer"}
              </Button>
              {front.context && onPlayAudio && (
                <button
                  className="text-xs font-semibold text-custom-primary hover:underline"
                  onClick={() => onPlayAudio(front.context)}
                >
                  Play context
                </button>
              )}
            </div>
          </div>
        </section>

        <section
          className="absolute inset-0 rounded-3xl border border-custom-border bg-white p-8 shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="space-y-5 h-full flex flex-col">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Review</p>
              <h2 className="text-2xl font-bold text-custom-text-dark">Compare Your Answer</h2>
            </div>
            <div className="rounded-2xl bg-custom-bg/60 border border-custom-border p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-custom-text-dark/60">YOUR ANSWER</p>
                <p className="text-sm text-custom-text-dark">{answer || "—"}</p>
              </div>
              <div className="h-px bg-custom-border" />
              <div>
                <p className="text-xs font-semibold text-custom-text-dark/60">STANDARD ANSWER</p>
                <p className="text-sm text-custom-text-dark">{back.referenceAnswer}</p>
                {onPlayAudio && (
                  <button
                    className="mt-2 text-xs font-semibold text-custom-primary hover:underline"
                    onClick={() => onPlayAudio(back.referenceAnswer)}
                  >
                    Play answer
                  </button>
                )}
              </div>
            </div>

            {evaluation && (
              <div className="rounded-2xl border border-custom-border bg-white p-4 space-y-2">
                <p className="text-sm font-semibold text-custom-text-dark">Coach Feedback</p>
                <p className="text-sm text-custom-text-dark/70">{evaluation.feedback}</p>
                {evaluation.corrections.length > 0 && (
                  <div className="text-xs text-custom-text-dark/60">
                    Corrections: {evaluation.corrections.join(" · ")}
                  </div>
                )}
                {evaluation.pronunciationScore !== undefined && (
                  <div className="text-xs text-custom-text-dark/60">
                    Pronunciation Score: {evaluation.pronunciationScore}{" "}
                    {evaluation.pronunciationPassed === undefined
                      ? ""
                      : evaluation.pronunciationPassed
                        ? "(Pass)"
                        : "(Retry)"}
                  </div>
                )}
              </div>
            )}

            {item?.usageNotes ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-custom-text-dark/60 uppercase">Notes</p>
                <div className="text-sm text-custom-text-dark/70">• {item.usageNotes}</div>
              </div>
            ) : null}

            {item?.exampleSentences?.length ? (
              <div className="space-y-1 text-sm text-custom-text-dark/60">
                <p className="text-xs font-semibold uppercase">Examples</p>
                {item.exampleSentences.slice(0, 2).map((sentence, idx) => (
                  <p key={`${card.id}-ex-${idx}`}>• {sentence}</p>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};
