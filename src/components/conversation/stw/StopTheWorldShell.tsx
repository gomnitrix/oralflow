'use client';

import React, { useEffect, useMemo, useState } from "react";
import { StopTheWorldService } from "../../../domains/conversation/stw-service";
import type { ConversationSession, ConversationBubble } from "../../../domains/conversation/models";
import { TranscriptList } from "../../shared/TranscriptList";
import { CopilotPanel } from "../../copilot/Panel";
import { ControlBar } from "./ControlBar";

export interface StopTheWorldShellProps {
  scenarioTitle: string;
  mainGoal?: string;
  subGoals?: string[];
}

const useStopTheWorld = () => {
  const service = useMemo(
    () =>
      new StopTheWorldService({
        evaluation: {
          evaluate: async () => ({ evaluationId: `eval_${Date.now()}` }),
        },
      }),
    []
  );
  const [session, setSession] = useState<ConversationSession>(service.getSession());
  const [activeIndex, setActiveIndex] = useState(0);

  const updateSession = (next: ConversationSession) => {
    setSession({ ...next });
    setActiveIndex(next.bubbles.length - 1);
  };

  const startConversation = () => updateSession(service.startConversation("Bonjour! Qu'est-ce que je vous sers aujourd'hui?")); // Example initial message
  const startRecording = () => updateSession(service.startRecording());
  const stopRecording = () => updateSession(service.finishRecording({ text: "Sample utterance" }));
  const evaluate = async () => updateSession(await service.evaluate());
  const send = () => updateSession(service.send());
  const retry = () => updateSession(service.retry());

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "j") {
        setActiveIndex((prev) => Math.min(session.bubbles.length - 1, prev + 1));
      }
      if (event.key.toLowerCase() === "k") {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session.bubbles.length]);

  return {
    session,
    activeIndex,
    startConversation,
    startRecording,
    stopRecording,
    evaluate,
    send,
    retry,
  };
};

export const StopTheWorldShell: React.FC<StopTheWorldShellProps> = ({ scenarioTitle, mainGoal, subGoals }) => {
  const { session, activeIndex, startConversation, startRecording, stopRecording, evaluate, send, retry } =
    useStopTheWorld();
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "review">("idle");
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll to bottom when bubbles change
  const transcriptEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.bubbles.length]);

  const handleRecord = () => {
    setError(null);
    startRecording();
    setRecordingStatus("recording");
  };

  const handleStop = () => {
    setError(null);
    stopRecording();
    setRecordingStatus("review");
  };

  const handleSend = () => {
    setError(null);
    send();
    setRecordingStatus("idle");
  };

  const handleRetry = () => {
    setError(null);
    retry();
    setRecordingStatus("idle"); // Reset to idle to allow re-recording
    // Ideally, retry should clear the last user bubble and let them record again immediately or go back to idle.
    // Based on requirements: "Retry: Clear bubble and re-record".
    // So we might want to auto-start recording or just go to idle. Let's go to idle.
  };

  // Trigger AI greeting if session is empty
  useEffect(() => {
    if (session.bubbles.length === 0) {
      startConversation();
    }
  }, [session.bubbles.length, startConversation]);

  const bubblesWithActive = session.bubbles.map((bubble, index) => ({
    ...bubble,
    isActive: index === activeIndex,
  }));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-custom-bg">
      {/* Left Column: Dialogue Arena */}
      <div className="flex-1 flex flex-col relative border-r border-custom-border bg-white lg:max-w-[60%]">
        {/* Header */}
        <header className="p-6 border-b border-custom-border bg-white z-10 shadow-sm">
          <div className="mb-4">
            <p className="text-xs uppercase text-custom-text-dark/60 tracking-wider mb-1">Scenario</p>
            <h1 className="text-2xl font-black text-custom-text-dark tracking-tight">{scenarioTitle}</h1>
          </div>

          {mainGoal && (
            <div className="bg-custom-primary/5 p-4 rounded-xl border border-custom-primary/10">
              <p className="text-xs font-bold text-custom-primary uppercase tracking-wider mb-1">Your Goal</p>
              <p className="text-sm text-custom-text-dark font-medium">{mainGoal}</p>
              {subGoals && subGoals.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {subGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-custom-text-dark/80">
                      <span className="material-symbols-outlined text-custom-primary text-sm shrink-0">check_circle</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </header>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-smooth">
          <TranscriptList bubbles={bubblesWithActive as ConversationBubble[]} />
          <div ref={transcriptEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-24 left-6 right-6 bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 lg:right-[40%]">
          <ControlBar
            status={recordingStatus}
            onRecord={handleRecord}
            onStop={handleStop}
            onSend={handleSend}
            onRetry={handleRetry}
          />
        </div>
      </div>

      {/* Right Column: Copilot Coach */}
      <div className="flex-1 bg-custom-bg flex flex-col h-full overflow-hidden">
        <CopilotPanel mode={recordingStatus === "review" ? "assessment" : "standard"} />
      </div>
    </div>
  );
};
