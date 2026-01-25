"use client";

import React, { useCallback, useEffect, useState } from "react";
import { TrainingSessionShell } from "./TrainingSessionShell";
import { Button } from "../shared/Button";
import type { NotebookItem } from "../../domains/notes/models";
import type { ReviewCard, ReviewTask, TrainingSession } from "../../domains/training/models";

interface SessionPayload {
  session: TrainingSession;
  tasks: ReviewTask[];
  cards: ReviewCard[];
  items: NotebookItem[];
}

interface SessionSummary {
  dueItemCount: number;
  totalCardCount: number;
  existingCardCount: number;
  newCardCount: number;
}

type FlowState = "transition" | "active" | "summary";

export const TrainingFlow: React.FC = () => {
  const [flowState, setFlowState] = useState<FlowState>("transition");
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [sessionPayload, setSessionPayload] = useState<SessionPayload | null>(null);
  const [disableNewCards, setDisableNewCards] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<{
    sessionId: string;
    cardsReviewed: number;
    itemsReviewed: number;
  } | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const response = await fetch("/api/training/session/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "review", disableNewCards }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load summary.");
      }
      setSummary(data.summary as SessionSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary.");
    } finally {
      setLoadingSummary(false);
    }
  }, [disableNewCards]);

  useEffect(() => {
    if (flowState === "transition") {
      void fetchSummary();
    }
  }, [fetchSummary, flowState]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/training/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "review", disableNewCards, lazyGeneration: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to start training.");
      }
      setSessionPayload(data as SessionPayload);
      setFlowState("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start training.");
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = (result: { sessionId: string; cardsReviewed: number; itemsReviewed: number }) => {
    setSessionResult(result);
    setFlowState("summary");
  };

  const handleExit = () => {
    setFlowState("transition");
  };

  if (flowState === "active" && sessionPayload) {
    return <TrainingSessionShell payload={sessionPayload} onComplete={handleComplete} onExit={handleExit} />;
  }

  if (flowState === "summary" && sessionResult) {
    return (
      <div className="rounded-3xl border border-custom-border bg-white p-8 shadow-sm space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Session Complete</p>
          <h2 className="text-2xl font-bold text-custom-text-dark">Nice work!</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-custom-text-dark/70">
          <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
            <p className="text-xs uppercase text-custom-text-dark/50">Cards Reviewed</p>
            <p className="text-2xl font-bold text-custom-text-dark">{sessionResult.cardsReviewed}</p>
          </div>
          <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
            <p className="text-xs uppercase text-custom-text-dark/50">Items Reviewed</p>
            <p className="text-2xl font-bold text-custom-text-dark">{sessionResult.itemsReviewed}</p>
          </div>
          <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
            <p className="text-xs uppercase text-custom-text-dark/50">Session ID</p>
            <p className="text-xs text-custom-text-dark/70">{sessionResult.sessionId}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleExit}>
            Back to Summary
          </Button>
          <Button variant="ghost" href="/ask">
            Add more expressions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-custom-border bg-white p-8 shadow-sm space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Training Overview</p>
        <h2 className="text-2xl font-bold text-custom-text-dark">Ready to review?</h2>
        <p className="text-sm text-custom-text-dark/60">
          Your session starts immediately with existing cards. New cards generate in the background.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-custom-text-dark/70">
        <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
          <p className="text-xs uppercase text-custom-text-dark/50">Notes Due</p>
          <p className="text-2xl font-bold text-custom-text-dark">
            {summary?.dueItemCount ?? (loadingSummary ? "…" : 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
          <p className="text-xs uppercase text-custom-text-dark/50">Total Cards</p>
          <p className="text-2xl font-bold text-custom-text-dark">
            {summary?.totalCardCount ?? (loadingSummary ? "…" : 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
          <p className="text-xs uppercase text-custom-text-dark/50">Existing Cards</p>
          <p className="text-2xl font-bold text-custom-text-dark">
            {summary?.existingCardCount ?? (loadingSummary ? "…" : 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4">
          <p className="text-xs uppercase text-custom-text-dark/50">New Cards</p>
          <p className="text-2xl font-bold text-custom-text-dark">
            {summary?.newCardCount ?? (loadingSummary ? "…" : 0)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-custom-text-dark">
          <input
            type="checkbox"
            checked={disableNewCards}
            onChange={(e) => setDisableNewCards(e.target.checked)}
            className="h-4 w-4 rounded border-custom-border text-custom-primary focus:ring-custom-primary"
          />
          Disable New Card Generation
        </label>
        <Button variant="primary" onClick={handleStart} disabled={starting || loadingSummary}>
          {starting ? "Starting..." : "Start Training"}
        </Button>
      </div>
    </div>
  );
};
