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
    setActiveIndex,
  };
};

export const StopTheWorldShell: React.FC<StopTheWorldShellProps> = ({ scenarioTitle, mainGoal, subGoals }) => {
  const { session, activeIndex, startConversation, startRecording, stopRecording, evaluate, send, retry, setActiveIndex } =
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
    setRecordingStatus("idle");
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

  const activeBubble = session.bubbles[activeIndex];

  return (
    <div className="grid grid-cols-10 h-[calc(100vh-4rem)] overflow-hidden bg-custom-bg">
      {/* Left Column: Dialogue Arena (60%) */}
      <div className="col-span-10 lg:col-span-6 flex flex-col relative border-r border-custom-border bg-gray-50/50">
        {/* Header */}
        <header className="p-6 bg-transparent z-10 flex items-center justify-between">
          <h1 className="text-xl font-black text-custom-text-dark tracking-tight">{scenarioTitle}</h1>

          {mainGoal && (
            <div className="group relative">
              <div className="bg-custom-primary/5 px-4 py-2 rounded-full border border-custom-primary/10 cursor-help">
                <p className="text-sm text-custom-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">flag</span>
                  {mainGoal}
                </p>
              </div>

              {/* Hover Popover for Subgoals */}
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

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-smooth">
          <TranscriptList
            bubbles={bubblesWithActive as ConversationBubble[]}
            onBubbleClick={(id) => {
              // Find index of clicked bubble
              const idx = session.bubbles.findIndex(b => b.id === id);
              if (idx !== -1) {
                // We need to expose setActiveIndex from the hook or handle it differently.
                // For now, since we can't easily change the hook return without refactoring, 
                // we might need to assume the hook exposes it or we refactor the hook in this file.
                // Wait, the hook is defined in this file above. I should update the hook return first.
                setActiveIndex(idx);
              }
            }}
          />
          <div ref={transcriptEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-24 left-6 right-6 bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <ControlBar
            status={recordingStatus}
            onRecord={handleRecord}
            onStop={handleStop}
            onSend={handleSend}
            onRetry={handleRetry}
          />
        </div>
      </div>

      {/* Right Column: Copilot Coach (40%) */}
      <div className="hidden lg:flex col-span-4 bg-white flex-col h-full overflow-hidden z-20">
        <CopilotPanel
          mode={recordingStatus === "review" ? "assessment" : "standard"}
          selectedBubble={activeBubble}
        />
      </div>
    </div>
  );
};
