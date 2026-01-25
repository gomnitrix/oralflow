'use client';

import React from "react";
import type { NotebookItem } from "../../domains/notes/models";
import type { ReviewCard as ReviewCardModel } from "../../domains/training/models";
import { Button } from "../shared/Button";

export interface CardEvaluationSummary {
  score: number;
  feedback: string;
  corrections: string[];
  isCorrect: boolean;
  referenceAnswer: string;
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
  const front = card.content.front;
  const back = card.content.back;
  const notes = [
    ...(back.notes ?? []),
    ...(item?.usageNotes ? [item.usageNotes] : []),
  ].filter(Boolean);

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
              <h2 className="text-3xl font-bold text-custom-text-dark">{front.title}</h2>
            </div>
            <div className="space-y-3">
              {front.context && (
                <p className="text-sm text-custom-text-dark/60">{front.context}</p>
              )}
              <p className="text-lg text-custom-text-dark">{front.prompt}</p>
              {front.cue && (
                <div className="inline-flex items-center rounded-full border border-custom-border bg-custom-bg px-3 py-1 text-sm text-custom-text-dark/70">
                  Cue: {front.cue}
                </div>
              )}
            </div>
            <div className="flex-1">
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
            </div>
            <div className="flex items-center justify-between">
              <Button variant="secondary" onClick={onReveal} disabled={loading}>
                {loading ? "Checking..." : "Show Answer"}
              </Button>
              {front.prompt && onPlayAudio && (
                <button
                  className="text-xs font-semibold text-custom-primary hover:underline"
                  onClick={() => onPlayAudio(front.prompt)}
                >
                  Play prompt
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
              </div>
            )}

            {notes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-custom-text-dark/60 uppercase">Notes</p>
                <div className="space-y-1 text-sm text-custom-text-dark/70">
                  {notes.map((note, idx) => (
                    <p key={`${card.id}-note-${idx}`}>• {note}</p>
                  ))}
                </div>
              </div>
            )}

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
