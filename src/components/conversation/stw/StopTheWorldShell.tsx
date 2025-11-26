'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
        if (data.goalStatus) {
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
  }, [bootstrapGreeting, scenarioId, mainGoal, subGoals]);

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
      const data = await callAction<{ reply: string; audioUrl?: string | null; goalStatus?: any }>({
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
      if (data.goalStatus) {
        setGoalStatus(deriveGoalStatus(data.goalStatus, mainGoal, subGoals));
      }
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
  const goalsComplete = goalStatus.main === "completed_all";

  return (
    <>
      <div className="grid grid-cols-10 h-screen overflow-hidden bg-[#f8f6f6]">
        <div className="col-span-10 lg:col-span-6 flex flex-col relative border-r border-custom-border bg-[#f8f6f6]">
          <header className="p-6 bg-transparent z-10 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-custom-text-dark tracking-tight">{scenarioTitle}</h1>
              <p className="text-sm text-custom-text-dark/60 mt-1">
                {learnerRole ? `${learnerRole} ↔ ${aiRole ?? "AI Partner"}` : aiRole || "AI Partner"}
              </p>
            </div>

          <div className="flex items-center gap-3">
            {mainGoal && (
              <div className="group relative">
                <div className="bg-custom-primary/5 px-4 py-2 rounded-full border border-custom-primary/10 cursor-help flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      goalStatus.main === "completed_all"
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
                            className={`material-symbols-outlined text-base shrink-0 ${
                              goal.status === "completed" ? "text-green-500" : "text-custom-text-dark/40"
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
            )}

            <button
              onClick={() => {
                if (goalStatus.main === "completed_all") {
                  setIsEnding(true);
                  router.push("/");
                } else {
                  setShowEndConfirm(true);
                }
              }}
              className="flex items-center gap-2 bg-white border border-custom-border rounded-full px-3 py-2 text-sm font-semibold text-custom-text-dark shadow-sm hover:bg-gray-50 transition pointer-events-auto"
              disabled={isEnding}
            >
              <span className="material-symbols-outlined text-base">logout</span>
              {isEnding ? "Ending..." : "End Session"}
            </button>
          </div>
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

    {showEndConfirm && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl border border-custom-border p-6 w-full max-w-md">
          <h3 className="text-lg font-bold text-custom-text-dark mb-2">Goals not completed</h3>
          <p className="text-sm text-custom-text-dark/70 mb-4">
            Some goals are still pending. Are you sure you want to end this session now?
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 text-sm font-semibold rounded-full border border-custom-border text-custom-text-dark hover:bg-gray-50"
              onClick={() => setShowEndConfirm(false)}
            >
              Keep practicing
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold rounded-full bg-custom-primary text-white shadow hover:opacity-90"
              onClick={() => {
                setIsEnding(true);
                setShowEndConfirm(false);
                router.push("/");
              }}
            >
              End anyway
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
