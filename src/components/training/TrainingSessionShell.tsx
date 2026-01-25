"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NotebookItem } from "../../domains/notes/models";
import type { ReviewCard, ReviewTask, TrainingSession } from "../../domains/training/models";
import { DifficultySelector } from "./DifficultySelector";
import { TrainingControlBar } from "./TrainingControlBar";
import { TrainingProgressBar } from "./TrainingProgressBar";
import { CardStack } from "./CardStack";
import { ReviewCard as ReviewCardView, type CardEvaluationSummary } from "./ReviewCard";
import { Button } from "../shared/Button";

interface SessionPayload {
  session: TrainingSession;
  tasks: ReviewTask[];
  cards: ReviewCard[];
  items: NotebookItem[];
}

export const TrainingSessionShell: React.FC = () => {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [evaluation, setEvaluation] = useState<CardEvaluationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const audioCacheRef = useRef<Record<string, string>>({});

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const currentCard = cards[currentIndex] ?? null;
  const nextCard = cards[currentIndex + 1] ?? null;
  const currentTask = currentCard
    ? tasks.find((task) => task.notebookItemId === currentCard.notebookItemId) ?? null
    : null;
  const currentItem = currentCard ? itemMap.get(currentCard.notebookItemId) ?? null : null;

  const resetCardState = useCallback(() => {
    setAnswer("");
    setRevealed(false);
    setEvaluation(null);
    setShowRating(false);
    setIsRecording(false);
  }, []);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/training/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "review" }),
      });
      const data = (await response.json()) as SessionPayload;
      if (!response.ok) {
        throw new Error((data as any)?.error || "Failed to start session.");
      }
      setSession(data.session);
      setTasks(data.tasks);
      setCards(data.cards);
      setItems(data.items);
      setCurrentIndex(0);
      resetCardState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session.");
    } finally {
      setLoading(false);
    }
  }, [resetCardState]);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const handleReveal = async () => {
    if (!currentCard) return;
    setRevealed(true);
    setShowRating(false);
    setLoadingAnswer(true);
    setError(null);
    try {
      const response = await fetch("/api/training/card/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: currentCard.id, answerText: answer }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to evaluate answer.");
      }
      setEvaluation(data.evaluation as CardEvaluationSummary);
      setShowRating(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate answer.");
      setShowRating(true);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleRate = async (rating: "forgot" | "hard" | "good" | "easy") => {
    if (!currentCard) return;
    setError(null);
    try {
      await fetch("/api/training/item/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: currentTask?.id ?? null,
          notebookItemId: currentCard.notebookItemId,
          rating,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rating.");
    } finally {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      resetCardState();
    }
  };

  const handleSkip = () => {
    if (!currentCard) return;
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    resetCardState();
  };

  const handleRetry = () => {
    setAnswer("");
    setEvaluation(null);
    setRevealed(false);
    setShowRating(false);
  };

  const handleRecord = () => {
    setIsRecording((prev) => !prev);
  };

  const handlePlayAudio = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const key = trimmed.toLowerCase();
      if (!audioCacheRef.current[key]) {
        const response = await fetch("/api/training/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        const data = await response.json();
        if (!response.ok || !data?.audioUrl) {
          throw new Error(data?.error || "Failed to generate audio.");
        }
        audioCacheRef.current[key] = data.audioUrl;
      }
      const audio = new Audio(audioCacheRef.current[key]);
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to play audio.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-custom-border bg-white p-8 shadow-sm text-center">
        <p className="text-sm text-custom-text-dark/60">Preparing your session...</p>
      </div>
    );
  }

  if (!cards.length || !currentCard) {
    return (
      <div className="rounded-3xl border border-custom-border bg-white p-8 shadow-sm text-center space-y-3">
        <p className="text-lg font-bold text-custom-text-dark">All caught up!</p>
        <p className="text-sm text-custom-text-dark/60">Add more expressions to keep practicing.</p>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="flex justify-center gap-3">
          <Button variant="secondary" href="/ask">Go to Ask</Button>
          <Button variant="secondary" href="/scenarios/create">Scenario Studio</Button>
        </div>
        <Button variant="ghost" onClick={fetchSession}>Refresh session</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrainingProgressBar current={currentIndex + 1} total={cards.length} />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <CardStack next={nextCard}>
        <ReviewCardView
          card={currentCard}
          item={currentItem}
          answer={answer}
          revealed={revealed}
          evaluation={evaluation}
          onAnswerChange={setAnswer}
          onReveal={handleReveal}
          onPlayAudio={handlePlayAudio}
          loading={loadingAnswer}
        />
      </CardStack>

      <DifficultySelector task={currentTask} open={showRating} onSelect={handleRate} />

      <TrainingControlBar
        isRecording={isRecording}
        onRecord={handleRecord}
        onRetry={handleRetry}
        onSkip={handleSkip}
        disabled={loadingAnswer}
      />

      {session && (
        <p className="text-xs text-custom-text-dark/50">
          Session ID: {session.id}
        </p>
      )}
    </div>
  );
};
