'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createConversationBubble,
  createConversationSession,
  type ConversationBubble,
  type ConversationSession,
  type EvaluationRun,
} from "../../../domains/conversation/models";
import { TranscriptList } from "../../shared/TranscriptList";
import { CopilotPanel } from "../../copilot/Panel";
import { ControlBar, type ControlBarStatus } from "./ControlBar";
import { SessionSummaryModal, type SessionScores } from "./SessionSummaryModal";

export interface StopTheWorldShellProps {
  scenarioId: string;
  scenarioTitle: string;
  learnerRole?: string;
  aiRole?: string;
  mainGoal?: string;
  subGoals?: string[];
  description?: string;
  freeContext?: { fullText: string; snippet: string; summary: string };
  disableGoalEvaluation?: boolean;
}

type GoalStatusValue = "pending" | "partial" | "completed" | "completed_all";
type GoalStatus = {
  main: GoalStatusValue;
  subGoals: { text: string; status: "pending" | "completed" }[];
};

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

const cloneSession = (session: ConversationSession): ConversationSession => {
  if (typeof structuredClone === "function") {
    return structuredClone(session);
  }
  return JSON.parse(JSON.stringify(session)) as ConversationSession;
};

const deriveControlBarStatus = (session: ConversationSession): ControlBarStatus => {
  const lastUser = [...session.bubbles].reverse().find((b) => b.speaker === "user");
  if (lastUser && ["pending", "evaluating", "readyToSend"].includes(lastUser.state)) {
    return "review";
  }
  if (lastUser?.state === "recording") {
    return "recording";
  }
  return "idle";
};

const preferredMimeTypes = ["audio/wav", "audio/mp3", "audio/webm;codecs=pcm", "audio/webm;codecs=opus", "audio/ogg;codecs=opus"];

const pickSupportedMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const mime of preferredMimeTypes) {
    if ((MediaRecorder as any).isTypeSupported?.(mime)) {
      return mime;
    }
  }
  return undefined;
};

const generateRunId = () =>
(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ? crypto.randomUUID()
  : `run_${Math.random().toString(36).slice(2, 10)}`);

const floatTo16BitPCM = (buffer: Float32Array): Int16Array => {
  const output = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
};

const encodeWav = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 1;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const pcm = floatTo16BitPCM(samples);

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, pcm.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += bytesPerSample) {
    view.setInt16(offset, pcm[i], true);
  }

  return buffer;
};

const resampleToMono16k = (audioBuffer: AudioBuffer): Float32Array => {
  const targetRate = 16000;
  if (audioBuffer.sampleRate === targetRate && audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  // Mixdown to mono
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      mono[i] += data[i] / audioBuffer.numberOfChannels;
    }
  }

  // Resample to 16k via linear interpolation
  const targetLength = Math.round((mono.length * targetRate) / audioBuffer.sampleRate);
  const resampled = new Float32Array(targetLength);
  const ratio = (mono.length - 1) / (targetLength - 1);
  for (let i = 0; i < targetLength; i++) {
    const idx = i * ratio;
    const idx1 = Math.floor(idx);
    const idx2 = Math.min(idx1 + 1, mono.length - 1);
    const frac = idx - idx1;
    resampled[i] = mono[idx1] * (1 - frac) + mono[idx2] * frac;
  }

  return resampled;
};

const convertBlobToWav = async (blob: Blob): Promise<Blob> => {
  if (blob.type.includes("wav") || blob.type.includes("mp3")) {
    return blob;
  }

  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  const resampledMono = resampleToMono16k(decoded);
  const wavBuffer = encodeWav(resampledMono, 16000);
  return new Blob([wavBuffer], { type: "audio/wav" });
};

const deriveGoalStatus = (
  response: any,
  mainGoal?: string,
  subGoals?: string[]
): GoalStatus => {
  const sub = (subGoals ?? []).map((text) => ({ text, status: "pending" as const }));
  if (!response) {
    return { main: "pending", subGoals: sub };
  }

  const fromResponse = (response.subStatuses ?? response.subgoals ?? response.subGoals ?? []) as any[];
  const mappedSubs: { text: string; status: "pending" | "completed" }[] = sub.map((sg) => {
    const match = fromResponse.find((r) => typeof r?.text === "string" && r.text.trim().toLowerCase() === sg.text.trim().toLowerCase());
    const status = typeof match?.status === "string" ? match.status.toLowerCase() : "pending";
    return { text: sg.text, status: status === "completed" ? "completed" : "pending" };
  });

  const mainStatus = typeof response.mainStatus === "string" ? response.mainStatus.toLowerCase()
    : typeof response.main_status === "string" ? response.main_status.toLowerCase()
      : "not_started";

  const allSubsCompleted = mappedSubs.every((sg) => sg.status === "completed");
  let main: GoalStatusValue = "pending";
  if (mainStatus === "completed") {
    main = allSubsCompleted ? "completed_all" : "partial";
  } else if (mainStatus === "in_progress") {
    main = "partial";
  }

  return { main, subGoals: mappedSubs };
};

export const StopTheWorldShell: React.FC<StopTheWorldShellProps> = ({
  scenarioId,
  scenarioTitle,
  learnerRole,
  aiRole,
  mainGoal,
  subGoals,
  description,
  freeContext,
  disableGoalEvaluation = false,
}) => {
  const router = useRouter();
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
  const [goalStatus, setGoalStatus] = useState<GoalStatus>(() =>
    deriveGoalStatus(null, mainGoal, subGoals)
  );
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionScores, setSessionScores] = useState<SessionScores | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>("");
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingCheckpointRef = useRef<{ session: ConversationSession; activeIndex: number } | null>(null);
  const recordingCancelledRef = useRef(false);

  const scenario = useMemo(
    () => scenarioPayload({ scenarioId, scenarioTitle, learnerRole, aiRole, mainGoal, subGoals, description }),
    [aiRole, description, learnerRole, mainGoal, scenarioId, scenarioTitle, subGoals]
  );

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleNavigationAttempt = (event: Event) => {
      const custom = event as CustomEvent<{ href?: string }>;
      if (!custom.detail?.href) return;
      event.preventDefault();
      setPendingNavigation(custom.detail.href);
      setShowEndConfirm(true);
    };
    window.addEventListener("oralflow:navigate", handleNavigationAttempt);
    return () => {
      window.removeEventListener("oralflow:navigate", handleNavigationAttempt);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) return;
        const avatar = typeof data.avatarUrl === "string" ? data.avatarUrl : "";
        if (isMounted) setUserAvatarUrl(avatar);
      } catch {
        // Ignore profile fetch errors.
      }
    };
    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

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
        const data = await callAction<{ reply: string; audioUrl?: string | null; goalStatus?: any }>({
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
        if (!disableGoalEvaluation && data.goalStatus) {
          setGoalStatus(deriveGoalStatus(data.goalStatus, mainGoal, subGoals));
        }
        setActiveIndex(0);
        if (data.audioUrl && typeof Audio !== "undefined") {
          const audio = new Audio(data.audioUrl);
          void audio.play().catch(() => undefined);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [disableGoalEvaluation, mainGoal, scenario, subGoals, updateSession]
  );

  useEffect(() => {
    const freshSession = createConversationSession({ scenarioId, mode: "stw" });
    const placeholder = createConversationBubble({
      sessionId: freshSession.id,
      speaker: "ai",
      text: "",
      state: "pending",
    });
    setSession({ ...freshSession, bubbles: [placeholder] });
    setActiveIndex(0);
    setRecordingStatus("idle");
    recordingCheckpointRef.current = null;
    recordingCancelledRef.current = false;
    void bootstrapGreeting(freshSession, placeholder.id);
  }, [bootstrapGreeting, scenarioId, mainGoal, subGoals]);

  const prevLastBubbleRef = useRef<{ id: string; state: string; textLen: number }>({ id: "", state: "", textLen: 0 });
  useEffect(() => {
    const endEl = transcriptEndRef.current;
    if (endEl && typeof endEl.scrollIntoView === "function") {
      endEl.scrollIntoView({ behavior: "smooth" });
    }

    const lastBubble = session.bubbles[session.bubbles.length - 1];
    if (!lastBubble) {
      prevLastBubbleRef.current = { id: "", state: "", textLen: 0 };
      return;
    }

    const prev = prevLastBubbleRef.current;
    const changed = lastBubble.id !== prev.id || lastBubble.state !== prev.state || (lastBubble.text?.length ?? 0) !== prev.textLen;

    if (changed) {
      if (lastBubble.speaker === "user" && lastBubble.state !== "recording") {
        setActiveIndex(session.bubbles.length - 1);
      }
      // For AI bubbles, only jump when they have text content
      if (lastBubble.speaker === "ai" && lastBubble.text) {
        setActiveIndex(session.bubbles.length - 1);
      }
    }

    prevLastBubbleRef.current = { id: lastBubble.id, state: lastBubble.state, textLen: lastBubble.text?.length ?? 0 };
  }, [session.bubbles]);

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
      const data = await callAction<{ text?: string; warning?: string }>({
        action: "transcribe",
        sessionId: sessionRef.current.id,
        audioBase64,
        mimeType,
      });
      if (data.warning) {
        throw new Error(data.warning);
      }
      if (!data.text) {
        throw new Error("Transcription unavailable. Please retry.");
      }
      return data.text;
    },
    []
  );

  const evaluateBubble = useCallback(
    async (bubble: ConversationBubble, audio: { base64?: string; mimeType?: string; audioUrl?: string | null }) => {
      setIsEvaluating(true);
      const runId = generateRunId();
      const now = new Date().toISOString();
      updateSession((prev) => ({
        ...prev,
        bubbles: prev.bubbles.map((b) =>
          b.id === bubble.id
            ? {
              ...b,
              state: "evaluating",
              updatedAt: now,
              evaluationRuns: [...(b.evaluationRuns ?? []), { id: runId, status: "pending", createdAt: now }],
            }
            : b
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

        const summary = {
          pronunciationIssues: data.pronunciationIssues ?? [],
          pronunciationScores: data.pronunciationScores ?? null,
          wordScores: data.wordScores ?? [],
          grammarIssues: data.grammarIssues ?? [],
          naturalnessNotes: data.naturalnessNotes ?? [],
          nativeLikeSuggestion: data.nativeLikeSuggestion ?? "",
          referenceAudioUrl: data.referenceAudioUrl ?? audio.audioUrl ?? bubble.audioUrl ?? null,
          pronunciationEnabled: data.pronunciationEnabled ?? false,
        };

        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            b.id === bubble.id
              ? {
                ...b,
                state: "readyToSend",
                evaluationId: data.evaluationId,
                evaluationSummary: summary,
                evaluationRuns: (b.evaluationRuns ?? []).map((run): EvaluationRun =>
                  run.id === runId
                    ? {
                      ...run,
                      status: "completed",
                      summary,
                      evaluationId: data.evaluationId,
                      errorMessage: null,
                    }
                    : run
                ),
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
            b.id === bubble.id
              ? {
                ...b,
                state: "pending",
                updatedAt: new Date().toISOString(),
                evaluationRuns: (b.evaluationRuns ?? []).map((run) =>
                  run.id === runId ? { ...run, status: "error", errorMessage: (err as Error).message } : run
                ),
              }
              : b
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
      recordingCheckpointRef.current = null;
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
        const transcript = await transcribeAudio(audioBase64, blob.type || "audio/wav");
        updateSession((prev) => ({
          ...prev,
          bubbles: prev.bubbles.map((b) =>
            b.id === recordingBubble.id ? { ...b, text: transcript, state: "pending" } : b
          ),
        }));
        const idx = sessionRef.current.bubbles.findIndex((b) => b.id === recordingBubble.id);
        if (idx >= 0) setActiveIndex(idx);
        await evaluateBubble(
          { ...recordingBubble, text: transcript, audioUrl },
          { base64: audioBase64, mimeType: blob.type, audioUrl }
        );
      } catch (err) {
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
      if (recordingStatus === "recording" || isTranscribing || isEvaluating || isReplying) return;

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
        recordingCancelledRef.current = false;
        recordingCheckpointRef.current = { session: cloneSession(sessionRef.current), activeIndex };
        const mimeType = pickSupportedMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          mediaRecorderRef.current = null;
          if (recordingCancelledRef.current) {
            audioChunksRef.current = [];
            recordingCancelledRef.current = false;
            return;
          }
          if (!audioChunksRef.current.length) return;
          const rawBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/wav" });
          void (async () => {
            let processed = rawBlob;
            if (rawBlob.type.includes("webm") || rawBlob.type.includes("ogg")) {
              try {
                processed = await convertBlobToWav(rawBlob);
              } catch (err) {
                console.warn("Failed to convert audio to wav, using raw blob", err);
              }
            }
            await finalizeRecording(processed);
          })();
        };

        recorder.start();
        mediaRecorderRef.current = recorder;

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
          } else {
            const newBubble = createConversationBubble({ sessionId: prev.id, speaker: "user", state: "recording" });
            bubbles = [...prev.bubbles, newBubble];
          }
          return { ...prev, bubbles };
        });
        setRecordingStatus("recording");
      } catch (err) {
        console.error("Microphone access failed", err);
        setRecordingStatus("idle");
        recordingCheckpointRef.current = null;
        recordingCancelledRef.current = false;
        audioChunksRef.current = [];
        setError(
          err instanceof Error
            ? `Microphone unavailable: ${err.message}. If on HTTP, allow insecure mic access or switch to HTTPS.`
            : "Microphone unavailable. Please allow access and try again. If on HTTP, enable mic permissions."
        );
      }
    },
    [activeIndex, finalizeRecording, isEvaluating, isReplying, isTranscribing, latestUserBubble, recordingStatus, updateSession]
  );

  const handleStop = useCallback(() => {
    if (recordingStatus !== "recording") return;
    mediaRecorderRef.current?.stop();
  }, [recordingStatus]);

  const handleCancelRecording = useCallback(() => {
    if (recordingStatus !== "recording") return;
    const hasRecorder = Boolean(mediaRecorderRef.current);
    recordingCancelledRef.current = true;
    audioChunksRef.current = [];
    setError(null);
    mediaRecorderRef.current?.stop();

    let restoredStatus: ControlBarStatus = "idle";
    const snapshot = recordingCheckpointRef.current;
    if (snapshot) {
      const restored = cloneSession(snapshot.session);
      updateSession(() => restored);
      setActiveIndex(snapshot.activeIndex);
      restoredStatus = deriveControlBarStatus(restored);
    } else {
      updateSession((prev) => {
        const nextSession = { ...prev, bubbles: prev.bubbles.filter((b) => b.state !== "recording") };
        restoredStatus = deriveControlBarStatus(nextSession);
        return nextSession;
      });
      setActiveIndex((prev) => Math.max(0, prev - 1));
    }

    setRecordingStatus(restoredStatus);
    setIsTranscribing(false);
    setIsEvaluating(false);
    setIsReplying(false);
    recordingCheckpointRef.current = null;
    if (!hasRecorder) {
      recordingCancelledRef.current = false;
    }
  }, [recordingStatus, updateSession]);

  const handleSend = useCallback(async () => {
    setError(null);
    const pending = latestUserBubble();
    if (!pending || pending.state !== "readyToSend") {
      setError("Wait for evaluation to finish before sending.");
      return;
    }

    const history = mapHistory(sessionRef.current.bubbles);
    // create placeholder AI bubble immediately
    let placeholderId: string | null = null;
    const sentAt = new Date().toISOString();
    updateSession((prev) => {
      const aiPlaceholder = createConversationBubble({
        sessionId: prev.id,
        speaker: "ai",
        text: "",
        state: "pending",
      });
      placeholderId = aiPlaceholder.id;
      const bubbles = prev.bubbles.map((b): ConversationBubble =>
        b.id === pending.id ? { ...b, state: "sent", updatedAt: sentAt } : b
      );
      return { ...prev, bubbles: [...bubbles, aiPlaceholder] };
    });

    setIsReplying(true);
    try {
      const data = await callAction<{ reply: string; audioUrl?: string | null; goalStatus?: any }>({
        action: "reply",
        sessionId: sessionRef.current.id,
        scenario,
        history,
        skipGoalEvaluation: disableGoalEvaluation,
        userText: pending.text,
      });

      updateSession((prev) => ({
        ...prev,
        bubbles: prev.bubbles.map((b): ConversationBubble =>
          b.id === pending.id
            ? { ...b, state: "sent", updatedAt: new Date().toISOString() }
            : b.id === placeholderId
              ? {
                ...b,
                text: data.reply,
                audioUrl: data.audioUrl ?? null,
                state: "sent",
                updatedAt: new Date().toISOString(),
              }
              : b
        ),
      }));

      if (!disableGoalEvaluation && data.goalStatus) {
        setGoalStatus(deriveGoalStatus(data.goalStatus, mainGoal, subGoals));
      }
      setRecordingStatus("idle");

      if (data.audioUrl && typeof Audio !== "undefined") {
        const audio = new Audio(data.audioUrl);
        void audio.play().catch(() => undefined);
      }
    } catch (err) {
      setError((err as Error).message);
      updateSession((prev) => ({
        ...prev,
        bubbles: prev.bubbles
          .filter((b) => b.id !== placeholderId)
          .map((b): ConversationBubble =>
            b.id === pending.id ? { ...b, state: "readyToSend", updatedAt: sentAt } : b
          ),
      }));
      setRecordingStatus("review");
    } finally {
      setIsReplying(false);
    }
  }, [disableGoalEvaluation, latestUserBubble, mainGoal, scenario, subGoals, updateSession]);

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
  const userHasAssessment = activeBubble?.speaker === "user" && Boolean(activeBubble?.evaluationRuns?.length || activeBubble?.evaluationSummary);
  const copilotMode: "standard" | "assessment" =
    activeBubble?.speaker === "user" && (activeBubble.state !== "sent" || userHasAssessment) ? "assessment" : "standard";

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target?.closest("input, textarea, [contenteditable='true']");
      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      const isSpace = event.code === "Space" || event.key === " ";

      if (isSpace && recordingStatus === "idle" && !controlsDisabled) {
        event.preventDefault();
        void handleRecord();
      }

      if (isSpace && recordingStatus === "recording") {
        event.preventDefault();
        handleStop();
      }

      if (key === "escape" && recordingStatus === "recording") {
        event.preventDefault();
        handleCancelRecording();
      }

      if (key === "enter" && recordingStatus === "review" && !controlsDisabled) {
        event.preventDefault();
        void handleSend();
      }

      if (key === "r" && recordingStatus === "review" && !controlsDisabled) {
        event.preventDefault();
        handleRetry();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [controlsDisabled, handleCancelRecording, handleRecord, handleRetry, handleSend, handleStop, recordingStatus]);

  const calculateScores = useCallback(() => {
    const userBubbles = sessionRef.current.bubbles.filter(
      (b) => b.speaker === "user" && b.state === "sent" && b.evaluationSummary
    );

    if (userBubbles.length === 0) return null;

    const totals = userBubbles.reduce(
      (acc, b) => {
        const scores = b.evaluationSummary?.pronunciationScores;
        if (!scores) return acc;
        return {
          accuracy: acc.accuracy + (scores.accuracy ?? 0),
          fluency: acc.fluency + (scores.fluency ?? 0),
          prosody: acc.prosody + (scores.prosody ?? 0),
          completeness: acc.completeness + (scores.completeness ?? 0),
          pronunciation: acc.pronunciation + (scores.overall ?? 0), // Using overall for pronunciation score
          count: acc.count + 1,
        };
      },
      { accuracy: 0, fluency: 0, prosody: 0, completeness: 0, pronunciation: 0, count: 0 }
    );

    if (totals.count === 0) return null;

    const averages = {
      accuracy: totals.accuracy / totals.count,
      fluency: totals.fluency / totals.count,
      prosody: totals.prosody / totals.count,
      completeness: totals.completeness / totals.count,
      pronunciation: totals.pronunciation / totals.count,
    };

    const overall =
      (averages.accuracy +
        averages.fluency +
        averages.prosody +
        averages.completeness +
        averages.pronunciation) /
      5;

    return { ...averages, overall };
  }, []);

  const handleEndSession = () => {
    const scores = calculateScores();
    setSessionScores(scores);
    setShowSummary(true);
    setShowEndConfirm(false);
  };

  return (
    <>
      <div className="grid grid-cols-10 h-screen bg-[#f8f6f6]">
        <div className="col-span-10 lg:col-span-6 flex flex-col relative border-r border-custom-border bg-[#f8f6f6] overflow-hidden">
          <header className="sticky top-0 z-30 p-6 bg-[#f8f6f6]/95 backdrop-blur flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-custom-text-dark tracking-tight">{scenarioTitle}</h1>
            </div>

            <div className="flex items-center gap-3">
              {freeContext ? (
                <div className="group relative">
                  <div className="bg-custom-primary/5 px-3 py-1.5 rounded-full border border-custom-primary/10 cursor-help flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-custom-primary">segment</span>
                    <p className="text-sm text-custom-primary font-bold truncate max-w-[320px]">
                      {freeContext.summary}
                    </p>
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-custom-border p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-xs font-bold text-custom-text-dark/60 uppercase tracking-wider mb-2">Context</p>
                    <p className="text-sm text-custom-text-dark whitespace-pre-wrap leading-relaxed">{freeContext.fullText}</p>
                  </div>
                </div>
              ) : mainGoal ? (
                <div className="group relative">
                  <div className="bg-custom-primary/5 px-3 py-1.5 rounded-full border border-custom-primary/10 cursor-help flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-lg ${goalStatus.main === "completed_all"
                        ? "text-green-600"
                        : goalStatus.main === "partial"
                          ? "text-amber-600"
                          : "text-custom-text-dark/50"
                        }`}
                    >
                      {goalStatus.main === "completed_all" ? "check_circle" : goalStatus.main === "partial" ? "task_alt" : "flag"}
                    </span>
                    <p className="text-sm text-custom-primary font-bold">{mainGoal}</p>
                  </div>

                  {subGoals && subGoals.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-custom-border p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <p className="text-xs font-bold text-custom-text-dark/60 uppercase tracking-wider mb-2">Subgoals</p>
                      <ul className="space-y-2">
                        {goalStatus.subGoals.map((goal, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-custom-text-dark">
                            <span
                              className={`material-symbols-outlined text-base shrink-0 ${goal.status === "completed" ? "text-green-500" : "text-custom-text-dark/40"
                                }`}
                            >
                              {goal.status === "completed" ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            {goal.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              <button
                onClick={() => {
                  if (goalStatus.main === "completed_all") {
                    handleEndSession();
                  } else {
                    setShowEndConfirm(true);
                  }
                }}
                className="flex items-center justify-center bg-white border border-custom-border rounded-full w-10 h-10 text-custom-text-dark shadow-sm hover:shadow transition hover:-translate-y-0.5 pointer-events-auto"
                disabled={isEnding}
                title="End session"
              >
                {isEnding ? (
                  <span className="material-symbols-outlined text-base text-gray-400 animate-ping">logout</span>
                ) : (
                  <span className="material-symbols-outlined text-base text-gray-500">logout</span>
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-smooth">
            <TranscriptList
              bubbles={bubblesWithActive as ConversationBubble[]}
              speakerLabels={{ user: learnerRole || "User", ai: aiRole || "AI" }}
              userAvatarUrl={userAvatarUrl}
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
              onCancel={handleCancelRecording}
              onSend={handleSend}
              onRetry={handleRetry}
              disabled={controlsDisabled}
            />
          </div>
        </div>

        <div className="hidden lg:flex col-span-4 bg-[#ffffff] flex-col h-screen overflow-hidden z-20">
          <CopilotPanel
            mode={copilotMode}
            selectedBubble={activeBubble}
            onDistill={() => handleCopilot("distill")}
            onInspiration={(prompt) => handleCopilot("inspiration", prompt)}
            loading={copilotLoading}
          />
        </div>
      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-custom-border p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-custom-text-dark mb-2">
              {freeContext ? "End session?" : "Goals not completed"}
            </h3>
            <p className="text-sm text-custom-text-dark/70 mb-4">
              {freeContext
                ? "Are you sure you want to end this free chat session now?"
                : "Some goals are still pending. Are you sure you want to end this session now?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm font-semibold rounded-full border border-custom-border text-custom-text-dark hover:bg-gray-50"
                onClick={() => {
                  setShowEndConfirm(false);
                  setPendingNavigation(null);
                }}
              >
                {freeContext ? "Stay in chat" : "Keep practicing"}
              </button>
              <button
                className="px-4 py-2 text-sm font-semibold rounded-full bg-custom-primary text-white shadow hover:opacity-90"
                onClick={() => {
                  if (pendingNavigation) {
                    const target = pendingNavigation;
                    setPendingNavigation(null);
                    setShowEndConfirm(false);
                    router.push(target);
                    return;
                  }
                  handleEndSession();
                }}
              >
                End anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <SessionSummaryModal
          isOpen={showSummary}
          scores={sessionScores}
          onHome={() => router.push("/")}
        />
      )}
    </>
  );
};
