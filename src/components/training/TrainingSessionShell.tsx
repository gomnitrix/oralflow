"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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

interface TrainingSessionShellProps {
  payload: SessionPayload;
  onComplete?: (summary: { sessionId: string; cardsReviewed: number; itemsReviewed: number }) => void;
  onExit?: () => void;
}

const preferredMimeTypes = [
  "audio/wav",
  "audio/mp3",
  "audio/webm;codecs=pcm",
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
];

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return undefined;
  return preferredMimeTypes.find((mime) => (MediaRecorder as any).isTypeSupported?.(mime));
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read audio blob"));
    reader.readAsDataURL(blob);
  });

export const TrainingSessionShell: React.FC<TrainingSessionShellProps> = ({ payload, onComplete, onExit }) => {
  const [session, setSession] = useState<TrainingSession | null>(payload.session);
  const [tasks, setTasks] = useState<ReviewTask[]>(payload.tasks);
  const [cards, setCards] = useState<ReviewCard[]>(payload.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [evaluation, setEvaluation] = useState<CardEvaluationSummary | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "review">("idle");
  const [recordedAudio, setRecordedAudio] = useState<{ base64: string; mimeType: string } | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const audioCacheRef = useRef<Record<string, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const completedRef = useRef(false);

  const currentCard = cards[currentIndex] ?? null;
  const nextCard = cards[currentIndex + 1] ?? null;
  const currentTask = currentCard
    ? tasks.find((task) => task.notebookItemId === currentCard.notebookItemId) ?? null
    : null;

  const isLastCardForItem = useCallback(
    (index: number) => {
      const itemId = cards[index]?.notebookItemId;
      if (!itemId) return false;
      for (let i = index + 1; i < cards.length; i += 1) {
        if (cards[i].notebookItemId === itemId) {
          return false;
        }
      }
      return true;
    },
    [cards]
  );

  const resetCardState = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    setRevealed(false);
    setFlipped(false);
    setEvaluation(null);
    setShowRating(false);
    setRecordingStatus("idle");
    setRecordedAudio(null);
    setReadyToAdvance(false);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
  }, [recordedAudioUrl]);

  const advanceToNextCard = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    resetCardState();
  }, [resetCardState]);

  useEffect(() => {
    setSession(payload.session);
    setTasks(payload.tasks);
    setCards(payload.cards);
    setCurrentIndex(0);
    resetCardState();
    completedRef.current = false;
  }, [payload, resetCardState]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cards.length || completedRef.current) return;
    if (currentIndex >= cards.length) {
      completedRef.current = true;
      onComplete?.({
        sessionId: session?.id ?? "",
        cardsReviewed: cards.length,
        itemsReviewed: new Set(cards.map((card) => card.notebookItemId)).size,
      });
    }
  }, [cards, currentIndex, onComplete, session]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.");
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      setRecordedAudio(null);
      setRecordedAudioUrl(null);
      setReadyToAdvance(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        if (!audioChunksRef.current.length) {
          setRecordingStatus("idle");
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        try {
          const base64 = await blobToBase64(blob);
          const url = URL.createObjectURL(blob);
          setRecordedAudio({ base64, mimeType: blob.type || "audio/webm" });
          setRecordedAudioUrl(url);
          setRecordingStatus("review");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to process recording.");
          setRecordingStatus("idle");
        }
      };
      recorder.start();
      setRecordingStatus("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording.");
    }
  }, [recordedAudioUrl]);

  const handleRecord = () => {
    if (recordingStatus !== "idle") return;
    setError(null);
    startRecording();
  };

  const handleStop = () => {
    if (recordingStatus !== "recording") return;
    stopRecording();
  };

  const handleCardToggle = () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    setFlipped((prev) => !prev);
  };

  const handleSend = async () => {
    if (!currentCard) return;
    const lastForItem = isLastCardForItem(currentIndex);

    if (evaluation && readyToAdvance && !lastForItem) {
      advanceToNextCard();
      return;
    }

    if (evaluation && lastForItem) {
      return;
    }

    if (!recordedAudio) {
      setError("Please record your response before sending.");
      return;
    }

    setShowRating(false);
    setLoadingEvaluation(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        cardId: currentCard.id,
        debug: debugMode,
        audioBase64: recordedAudio.base64,
        audioMimeType: recordedAudio.mimeType,
      };

      const response = await fetch("/api/training/card/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to evaluate answer.");
      }
      setEvaluation(data.evaluation as CardEvaluationSummary);
      if (lastForItem) {
        setShowRating(true);
        setReadyToAdvance(false);
      } else {
        setReadyToAdvance(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate answer.");
      if (lastForItem) {
        setShowRating(true);
      }
      setReadyToAdvance(false);
    } finally {
      setLoadingEvaluation(false);
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
      advanceToNextCard();
    }
  };

  const handleSkip = () => {
    if (!currentCard) return;
    if (recordingStatus === "recording") {
      stopRecording();
    }
    if (isLastCardForItem(currentIndex)) {
      setShowRating(true);
      setReadyToAdvance(false);
      return;
    }
    advanceToNextCard();
  };

  const handleRetry = () => {
    setError(null);
    setEvaluation(null);
    setShowRating(false);
    setReadyToAdvance(false);
    setRevealed(false);
    setFlipped(false);
    setRecordingStatus("idle");
    setRecordedAudio(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
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

  const toggleDebug = () => setDebugMode((prev) => !prev);

  if (!cards.length || !currentCard) {
    const hasPendingTasks = tasks.length > 0;
    return (
      <div className="rounded-3xl border border-custom-border bg-white p-8 shadow-sm text-center space-y-3">
        <p className="text-lg font-bold text-custom-text-dark">
          {hasPendingTasks ? "Cards are on the way!" : "All caught up!"}
        </p>
        <p className="text-sm text-custom-text-dark/60">
          {hasPendingTasks
            ? "We're generating new cards in the background. Check back in a moment."
            : "Add more expressions to keep practicing."}
        </p>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="flex justify-center gap-3">
          {hasPendingTasks ? null : (
            <>
              <Button variant="secondary" href="/ask">Go to Ask</Button>
              <Button variant="secondary" href="/scenarios/create">Scenario Studio</Button>
            </>
          )}
        </div>
        {onExit ? (
          <Button variant="ghost" onClick={onExit}>Back to Summary</Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TrainingProgressBar current={currentIndex + 1} total={cards.length} />
        <button
          onClick={toggleDebug}
          className={`text-xs font-mono px-2 py-1 rounded border ${debugMode
            ? "bg-custom-primary/10 border-custom-primary text-custom-primary"
            : "bg-transparent border-transparent text-custom-text-dark/30 hover:text-custom-text-dark/60"
            }`}
        >
          DEBUG
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {debugMode && currentTask && currentCard && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs font-mono text-gray-600 space-y-2">
          <div>
            <p><strong>Task ID:</strong> {currentTask.id}</p>
            <p><strong>Card ID:</strong> {currentCard.id}</p>
            <p><strong>SRS State:</strong> Interval={currentTask.intervalDays}d | Ease={currentTask.easeFactor.toFixed(2)} | Reps={currentTask.repetitionCount}</p>
            <p><strong>Due:</strong> {new Date(currentTask.dueAt).toLocaleString()}</p>
            <p><strong>Status:</strong> {currentTask.status}</p>
          </div>
          {currentCard.metadata?.debug && (
            <div className="space-y-1">
              <p><strong>Generator System Prompt:</strong></p>
              <pre className="whitespace-pre-wrap">{currentCard.metadata.debug.systemPrompt}</pre>
              <p><strong>Generator User Prompt:</strong></p>
              <pre className="whitespace-pre-wrap">{currentCard.metadata.debug.userPrompt}</pre>
            </div>
          )}
          {evaluation?.debug && (
            <div className="space-y-1">
              <p><strong>Evaluator System Prompt:</strong></p>
              <pre className="whitespace-pre-wrap">{evaluation.debug.systemPrompt}</pre>
              <p><strong>Evaluator User Prompt:</strong></p>
              <pre className="whitespace-pre-wrap">{evaluation.debug.userPrompt}</pre>
            </div>
          )}
        </div>
      )}

      <CardStack next={nextCard}>
        <ReviewCardView
          card={currentCard}
          revealed={revealed}
          flipped={flipped}
          onToggle={handleCardToggle}
          onPlayAudio={handlePlayAudio}
        />
      </CardStack>

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

      <DifficultySelector task={currentTask} open={showRating} onSelect={handleRate} />

      <TrainingControlBar
        status={recordingStatus}
        onRecord={handleRecord}
        onStop={handleStop}
        onRetry={handleRetry}
        onSend={handleSend}
        onSkip={handleSkip}
        disabled={loadingEvaluation || showRating}
        sendLabel={readyToAdvance ? "Next Card" : "Send"}
      />

      {recordedAudioUrl ? (
        <div className="text-xs text-custom-text-dark/60">
          Recording ready.{" "}
          <button
            className="text-custom-primary hover:underline"
            onClick={() => new Audio(recordedAudioUrl).play()}
          >
            Play recording
          </button>
        </div>
      ) : null}

      {session && (
        <p className="text-xs text-custom-text-dark/50">
          Session ID: {session.id}
        </p>
      )}
    </div>
  );
};
