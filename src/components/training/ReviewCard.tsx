'use client';

import React from "react";
import type { ReviewCard as ReviewCardModel } from "../../domains/training/models";

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
  revealed: boolean;
  flipped: boolean;
  onToggle: () => void;
  onPlayAudio?: (text: string) => void;
  onDistill?: () => void;
  distillLoading?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  card,
  revealed,
  flipped,
  onToggle,
  onPlayAudio,
  onDistill,
  distillLoading = false,
}) => {
  const front = card.content.frontContent;
  const back = card.content.backContent;
  const typeLabel = {
    answer_generation: "Answer Generation",
    ask_question: "Ask a Question",
    translation: "Translation",
    read_aloud: "Read Aloud",
  }[card.type];

  const maskCueInAnswer = (answer: string, cue: string) => {
    if (!answer || !cue) return answer;
    const escaped = cue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    return answer.replace(regex, (match) => "_".repeat(Math.max(4, match.length)));
  };

  const maskedAnswer = maskCueInAnswer(back.referenceAnswer, front.cue);

  const renderContext = () => {
    if (!front.context) return null;
    return <p className="text-sm text-custom-text-dark/60">{front.context}</p>;
  };

  return (
    <div className="relative w-full" style={{ perspective: "1400px" }}>
      <div
        className="relative h-[28rem] w-full transition-transform duration-700"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <section
          className="absolute inset-0 rounded-3xl border border-custom-border bg-white p-8 shadow-lg cursor-pointer"
          style={{ backfaceVisibility: "hidden" }}
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggle();
            }
          }}
        >
          <div className="space-y-6 h-full flex flex-col">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Training Card</p>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-3xl font-bold text-custom-text-dark">{typeLabel}</h2>
                {onDistill && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDistill();
                    }}
                    disabled={distillLoading}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-custom-border bg-white text-custom-text-dark/60 transition hover:text-custom-primary hover:bg-custom-primary/10 disabled:opacity-100"
                    aria-label="Distill"
                  >
                    <span
                      className={`material-symbols-outlined text-lg ${distillLoading ? "animate-spin" : ""}`}
                    >
                      {distillLoading ? "autorenew" : "auto_awesome"}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {renderContext()}
              <p className="text-lg text-custom-text-dark">{front.task}</p>
              <div className="rounded-2xl border border-custom-border bg-custom-bg/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Answer</p>
                <p
                  className={`mt-2 text-base font-semibold transition-all ${revealed
                    ? "text-custom-text-dark"
                    : "text-custom-text-dark/30 blur-sm select-none"
                    }`}
                >
                  {maskedAnswer}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="absolute inset-0 rounded-3xl border border-custom-border bg-white p-8 shadow-lg cursor-pointer"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggle();
            }
          }}
        >
          <div className="space-y-5 h-full flex flex-col justify-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Review</p>
              <h2 className="text-2xl font-bold text-custom-text-dark">Reference Answer</h2>
            </div>
            <div className="rounded-2xl bg-custom-bg/60 border border-custom-border p-4 flex items-center justify-between gap-3">
              <p className="text-lg font-semibold text-custom-text-dark">{back.referenceAnswer}</p>
              {onPlayAudio && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPlayAudio(back.referenceAnswer);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-custom-text-dark/70 transition-colors hover:text-custom-primary hover:bg-custom-primary/10"
                  aria-label="Play pronunciation"
                >
                  <span className="material-symbols-outlined text-lg">volume_up</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
