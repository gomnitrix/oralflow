'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createConversationBubble,
  createConversationSession,
  type ConversationBubble,
  type ConversationSession,
} from "../../../domains/conversation/models";
import { TranscriptList } from "../../shared/TranscriptList";
import { CopilotPanel } from "../../copilot/Panel";
import { ControlBar, type ControlBarStatus } from "./ControlBar";

export interface StopTheWorldShellProps {
  scenarioId: string;
  scenarioTitle: string;
  learnerRole?: string;
  aiRole?: string;
  mainGoal?: string;
  subGoals?: string[];
  description?: string;
}

const blobToBase64 = async (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [, base64] = result.split(",");
      resolve(base64 || result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const callAction = async <T,>(payload: Record<string, unknown>): Promise<T> => {
  const response = await fetch("/api/conversation/stw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any)?.error || "Failed to reach conversation service");
  }
  return data as T;
};

const scenarioPayload = (input: StopTheWorldShellProps) => ({
  scenarioId: input.scenarioId,
  title: input.scenarioTitle,
  learnerRole: input.learnerRole ?? null,
  aiRole: input.aiRole ?? null,
  mainGoal: input.mainGoal ?? null,
  subGoals: input.subGoals ?? [],
  description: input.description ?? null,
});

const mapHistory = (bubbles: ConversationBubble[]) =>
  bubbles
    .filter((bubble) => bubble.state === "sent")
    .map((bubble) => ({ speaker: bubble.speaker, text: bubble.text }));

export const StopTheWorldShell: React.FC<StopTheWorldShellProps> = ({
  scenarioId,
  scenarioTitle,
  learnerRole,
  aiRole,
  mainGoal,
  subGoals,
  description,
}) => {
  const [session, setSession] = useState<ConversationSession>(() =>
    createConversationSession({ scenarioId, mode: "stw" })
  );
  const sessionRef = useRef(session);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState<ControlBarStatus>("idle");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const scenario = useMemo(
    () => scenarioPayload({ scenarioId, scenarioTitle, learnerRole, aiRole, mainGoal, subGoals, description }),
    [aiRole, description, learnerRole, mainGoal, scenarioId, scenarioTitle, subGoals]
  );

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const updateSession = useCallback((updater: (prev: ConversationSession) => ConversationSession) => {
    setSession((prev) => {
      const next = updater(prev);
      sessionRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "j") {
        setActiveIndex((prev) => Math.min(sessionRef.current.bubbles.length - 1, prev + 1));
      }
      if (key === "k") {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const bootstrapGreeting = useCallback(
    async (targetSession: ConversationSession, placeholderId?: string) => {
      try {
        const data = await callAction<{ reply: string; audioUrl?: string | null }>({
          action: "start",
          scenario,
        });

        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            placeholderId && b.id === placeholderId
              ? { ...b, text: data.reply, audioUrl: data.audioUrl ?? null, state: "sent", updatedAt: new Date().toISOString() }
              : b
          ),
        }));
        setActiveIndex(0);
        if (data.audioUrl && typeof Audio !== "undefined") {
          const audio = new Audio(data.audioUrl);
          void audio.play().catch(() => undefined);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [scenario, updateSession]
  );

  useEffect(() => {
    const freshSession = createConversationSession({ scenarioId, mode: "stw" });
    const placeholder = createConversationBubble({
      sessionId: freshSession.id,
      speaker: "ai",
      text: "Preparing reply…",
      state: "pending",
    });
    setSession({ ...freshSession, bubbles: [placeholder] });
    setActiveIndex(0);
    setRecordingStatus("idle");
    void bootstrapGreeting(freshSession, placeholder.id);
  }, [bootstrapGreeting, scenarioId]);

  useEffect(() => {
    const endEl = transcriptEndRef.current;
    if (endEl && typeof endEl.scrollIntoView === "function") {
      endEl.scrollIntoView({ behavior: "smooth" });
    }
  }, [session.bubbles.length]);

  useEffect(() => {
    if (session.bubbles.length === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > session.bubbles.length - 1) {
      setActiveIndex(session.bubbles.length - 1);
    }
  }, [activeIndex, session.bubbles.length]);

  const latestUserBubble = useCallback(() => {
    return [...sessionRef.current.bubbles].reverse().find((b) => b.speaker === "user") ?? null;
  }, []);

  const transcribeAudio = useCallback(
    async (audioBase64: string, mimeType: string) => {
      const data = await callAction<{ text: string }>({
        action: "transcribe",
        sessionId: sessionRef.current.id,
        audioBase64,
        mimeType,
        hint: mainGoal || scenarioTitle,
      });
      if (!data.text) {
        throw new Error("Transcription unavailable. Please retry.");
      }
      return data.text;
    },
    [mainGoal, scenarioTitle]
  );

  const evaluateBubble = useCallback(
    async (bubble: ConversationBubble, audio: { base64?: string; mimeType?: string; audioUrl?: string | null }) => {
      setIsEvaluating(true);
      updateSession((prev) => ({
        ...prev,
        bubbles: prev.bubbles.map((b) =>
          b.id === bubble.id ? { ...b, state: "evaluating", updatedAt: new Date().toISOString() } : b
        ),
      }));

      try {
        const response = await fetch("/api/conversation/stw-evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionRef.current.id,
            bubbleId: bubble.id,
            text: bubble.text,
            audioUrl: audio.audioUrl ?? bubble.audioUrl,
            audioBase64: audio.base64,
            audioMimeType: audio.mimeType,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to evaluate");
        }

        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            b.id === bubble.id
              ? {
                  ...b,
                  state: "readyToSend",
                  evaluationId: data.evaluationId,
                  evaluationSummary: {
                    pronunciationIssues: data.pronunciationIssues ?? [],
                    pronunciationScores: data.pronunciationScores ?? null,
                    wordScores: data.wordScores ?? [],
                    grammarIssues: data.grammarIssues ?? [],
                    naturalnessNotes: data.naturalnessNotes ?? [],
                    nativeLikeSuggestion: data.nativeLikeSuggestion ?? "",
                    referenceAudioUrl: data.referenceAudioUrl ?? b.audioUrl ?? null,
                    pronunciationEnabled: data.pronunciationEnabled ?? false,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }));
      } catch (err) {
        setError((err as Error).message);
        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            b.id === bubble.id ? { ...b, state: "pending", updatedAt: new Date().toISOString() } : b
          ),
        }));
      } finally {
        setIsEvaluating(false);
      }
    },
    [updateSession]
  );

  const finalizeRecording = useCallback(
    async (blob: Blob) => {
      const recordingBubble = latestUserBubble();
      if (!recordingBubble) return;

      const audioUrl = URL.createObjectURL(blob);
      const audioBase64 = await blobToBase64(blob);
      updateSession((prev) => ({
        ...prev,
        bubbles: prev.bubbles.map((b) =>
          b.id === recordingBubble.id
            ? { ...b, audioUrl, state: "pending", updatedAt: new Date().toISOString() }
            : b
        ),
      }));

      setRecordingStatus("review");
      setIsTranscribing(true);
      try {
        const transcript = await transcribeAudio(audioBase64, blob.type || "audio/webm");
        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            b.id === recordingBubble.id ? { ...b, text: transcript, state: "pending" } : b
          ),
        }));
        await evaluateBubble(
          { ...recordingBubble, text: transcript, audioUrl },
          { base64: audioBase64, mimeType: blob.type, audioUrl }
        );
      } catch (err) {
        console.error("[stw] transcription/evaluation failed", err);
        setError((err as Error).message);
      } finally {
        setIsTranscribing(false);
      }
    },
    [evaluateBubble, latestUserBubble, transcribeAudio, updateSession]
  );

  const handleRecord = useCallback(
    async (reuseBubbleId?: string) => {
      setError(null);
      if (recordingStatus === "recording") return;

      const lastUser = latestUserBubble();
      if (!reuseBubbleId && lastUser && ["recording", "pending", "evaluating"].includes(lastUser.state)) {
        setError("Finish the current attempt before starting a new one.");
        return;
      }

      try {
        const requestStream = () => {
          const navAny = navigator as any;
          const legacy = navAny.getUserMedia || navAny.webkitGetUserMedia || navAny.mozGetUserMedia;
          if (!navigator.mediaDevices) {
            (navAny.mediaDevices as any) = {};
          }
          if (!navigator.mediaDevices.getUserMedia && legacy) {
            navigator.mediaDevices.getUserMedia = (constraints: MediaStreamConstraints) =>
              new Promise<MediaStream>((resolve, reject) => legacy.call(navigator, constraints, resolve, reject));
          }

          if (navigator.mediaDevices?.getUserMedia) {
            return navigator.mediaDevices.getUserMedia({ audio: true });
          }
          throw new Error("getUserMedia not available");
        };

        const stream = await requestStream();
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (!audioChunksRef.current.length) return;
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          void finalizeRecording(blob);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;

        let targetIndex = 0;
        const now = new Date().toISOString();
        updateSession((prev) => {
          const existing = reuseBubbleId
            ? prev.bubbles.find((b) => b.id === reuseBubbleId && b.speaker === "user" && b.state !== "sent")
            : null;

          let bubbles: ConversationBubble[];
          if (existing) {
            bubbles = prev.bubbles.map((b) =>
              b.id === existing.id
                ? {
                    ...b,
                    text: "",
                    audioUrl: null,
                    state: "recording",
                    evaluationId: null,
                    evaluationSummary: null,
                    updatedAt: now,
                  }
                : b
            );
            targetIndex = bubbles.findIndex((b) => b.id === existing.id);
          } else {
            const newBubble = createConversationBubble({ sessionId: prev.id, speaker: "user", state: "recording" });
            bubbles = [...prev.bubbles, newBubble];
            targetIndex = bubbles.length - 1;
          }
          return { ...prev, bubbles };
        });
        setActiveIndex(targetIndex);
        setRecordingStatus("recording");
      } catch (err) {
        console.error("Microphone access failed", err);
        setRecordingStatus("idle");
        setError(
          err instanceof Error
            ? `Microphone unavailable: ${err.message}. If on HTTP, allow insecure mic access or switch to HTTPS.`
            : "Microphone unavailable. Please allow access and try again. If on HTTP, enable mic permissions."
        );
      }
    },
    [finalizeRecording, latestUserBubble, recordingStatus, updateSession]
  );

  const handleStop = useCallback(() => {
    if (recordingStatus !== "recording") return;
    mediaRecorderRef.current?.stop();
  }, [recordingStatus]);

  const handleSend = useCallback(async () => {
    setError(null);
    const pending = latestUserBubble();
    if (!pending || pending.state !== "readyToSend") {
      setError("Wait for evaluation to finish before sending.");
      return;
    }

    setIsReplying(true);
    try {
      const history = mapHistory(sessionRef.current.bubbles);
      const data = await callAction<{ reply: string; audioUrl?: string | null }>({
        action: "reply",
        sessionId: sessionRef.current.id,
        scenario,
        history,
        userText: pending.text,
      });

      let newIndex = 0;
      updateSession((prev) => {
        const bubbles = prev.bubbles.map((b): ConversationBubble =>
          b.id === pending.id ? { ...b, state: "sent", updatedAt: new Date().toISOString() } : b
        );
        const aiBubble = createConversationBubble({
          sessionId: prev.id,
          speaker: "ai",
          text: data.reply,
          audioUrl: data.audioUrl ?? null,
          state: "sent",
        });
        const nextBubbles = [...bubbles, aiBubble];
        newIndex = nextBubbles.length - 1;
        return { ...prev, bubbles: nextBubbles };
      });
      setActiveIndex(newIndex);
      setRecordingStatus("idle");

      if (data.audioUrl && typeof Audio !== "undefined") {
        const audio = new Audio(data.audioUrl);
        void audio.play().catch(() => undefined);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsReplying(false);
    }
  }, [latestUserBubble, scenario, updateSession]);

  const handleRetry = useCallback(() => {
    setRecordingStatus("idle");
    const current = latestUserBubble();
    void handleRecord(current?.id);
  }, [handleRecord, latestUserBubble]);

  const handleCopilot = useCallback(
    async (type: "distill" | "inspiration", topic?: string) => {
      const selected = sessionRef.current.bubbles[activeIndex];
      if (!selected || !selected.text) {
        setError("Select a bubble with text before using Copilot.");
        return;
      }

      setCopilotLoading(true);
      try {
        const data = await callAction<{ insight: ConversationBubble["copilotInsights"][number] }>({
          action: "copilot",
          sessionId: sessionRef.current.id,
          bubbleId: selected.id,
          bubbleText: selected.text,
          type,
          topic,
          history: sessionRef.current.bubbles.map((b) => ({ speaker: b.speaker, text: b.text })).filter((b) => b.text),
        });

        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            b.id === selected.id
              ? { ...b, copilotInsights: [...(b.copilotInsights ?? []), data.insight] }
              : b
          ),
        }));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setCopilotLoading(false);
      }
    },
    [activeIndex, updateSession]
  );

  const bubblesWithActive = session.bubbles.map((bubble, index) => ({
    ...bubble,
    isActive: index === activeIndex,
  }));

  const activeBubble = session.bubbles[activeIndex];
  const controlsDisabled = isTranscribing || isEvaluating || isReplying;
  const copilotMode: "standard" | "assessment" =
    activeBubble?.speaker === "user" && activeBubble.state !== "sent" ? "assessment" : "standard";

  return (
    <div className="grid grid-cols-10 h-screen overflow-hidden bg-[#f8f6f6]">
      <div className="col-span-10 lg:col-span-6 flex flex-col relative border-r border-custom-border bg-[#f8f6f6]">
        <header className="p-6 bg-transparent z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-custom-text-dark tracking-tight">{scenarioTitle}</h1>
            <p className="text-sm text-custom-text-dark/60 mt-1">
              {learnerRole ? `${learnerRole} ↔ ${aiRole ?? "AI Partner"}` : aiRole || "AI Partner"}
            </p>
          </div>

          {mainGoal && (
            <div className="group relative">
              <div className="bg-custom-primary/5 px-4 py-2 rounded-full border border-custom-primary/10 cursor-help">
                <p className="text-sm text-custom-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">flag</span>
                  {mainGoal}
                </p>
              </div>

              {subGoals && subGoals.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-custom-border p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-xs font-bold text-custom-text-dark/60 uppercase tracking-wider mb-2">Subgoals</p>
                  <ul className="space-y-2">
                    {subGoals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-custom-text-dark">
                        <span className="material-symbols-outlined text-green-500 text-base shrink-0">check_circle</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-smooth">
          <TranscriptList
            bubbles={bubblesWithActive as ConversationBubble[]}
            onBubbleClick={(id) => {
              const idx = session.bubbles.findIndex((b) => b.id === id);
              if (idx !== -1) setActiveIndex(idx);
            }}
          />
          <div ref={transcriptEndRef} />
        </div>

        {error && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 max-w-xl w-[90%] bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 shadow-md z-50">
            {error}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <ControlBar
            status={recordingStatus}
            onRecord={handleRecord}
            onStop={handleStop}
            onSend={handleSend}
            onRetry={handleRetry}
            disabled={controlsDisabled}
          />
        </div>
      </div>

      <div className="hidden lg:flex col-span-4 bg-[#ffffff] flex-col h-full overflow-hidden z-20">
        <CopilotPanel
          mode={copilotMode}
          selectedBubble={activeBubble}
          onDistill={() => handleCopilot("distill")}
          onInspiration={(prompt) => handleCopilot("inspiration", prompt)}
          loading={copilotLoading}
        />
      </div>
    </div>
  );
};
