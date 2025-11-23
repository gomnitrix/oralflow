import React, { useEffect, useMemo, useState } from "react";
import { StopTheWorldService } from "../../../domains/conversation/stw-service";
import type { ConversationSession, ConversationBubble } from "../../../domains/conversation/models";
import { TranscriptList } from "../../shared/TranscriptList";
import { Button } from "../../shared/Button";
import { CopilotPanel } from "../../copilot/Panel";

export interface StopTheWorldShellProps {
  scenarioTitle: string;
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
    startRecording,
    stopRecording,
    evaluate,
    send,
    retry,
  };
};

export const StopTheWorldShell: React.FC<StopTheWorldShellProps> = ({ scenarioTitle }) => {
  const { session, activeIndex, startRecording, stopRecording, evaluate, send, retry } =
    useStopTheWorld();
  const [error, setError] = useState<string | null>(null);

  const bubblesWithActive = session.bubbles.map((bubble, index) => ({
    ...bubble,
    isActive: index === activeIndex,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-white/60">Scenario</p>
            <h1 className="text-2xl font-semibold text-white">{scenarioTitle}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setError(null); startRecording(); }}>Record</Button>
            <Button variant="secondary" onClick={() => { setError(null); stopRecording(); }}>
              Stop
            </Button>
            <Button variant="secondary" onClick={() => evaluate().catch((err) => setError(err.message))}>
              Evaluate
            </Button>
            <Button variant="secondary" onClick={() => { setError(null); send(); }}>
              Send
            </Button>
            <Button variant="ghost" onClick={() => { setError(null); retry(); }}>
              Retry (J/K navigate)
            </Button>
          </div>
        </header>

        {error ? <p className="text-sm text-red-400">Error: {error}</p> : null}

        <TranscriptList bubbles={bubblesWithActive as ConversationBubble[]} />
      </div>

      <CopilotPanel />
    </div>
  );
};
