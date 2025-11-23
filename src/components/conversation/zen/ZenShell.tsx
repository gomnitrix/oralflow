import React, { useEffect, useState } from "react";
import { Button } from "../../shared/Button";
import type { ConversationBubble } from "../../../domains/conversation/models";

interface ZenShellProps {
  onEnd?: () => void;
}

export const ZenShell: React.FC<ZenShellProps> = ({ onEnd }) => {
  const [transcriptVisible, setTranscriptVisible] = useState(true);
  const [bubbles, setBubbles] = useState<ConversationBubble[]>([]);
  const [agentState, setAgentState] = useState<"listening" | "thinking" | "speaking">("listening");
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    const interval = setInterval(() => {
      setAgentState((prev) =>
        prev === "listening" ? "thinking" : prev === "thinking" ? "speaking" : "listening"
      );
    }, 1500);
    return () => {
      clearInterval(interval);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const endSession = () => {
    try {
      onEnd?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">Zen Mode</p>
          <h1 className="text-2xl font-semibold text-white">Realtime Conversation</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTranscriptVisible((v) => !v)}>
            {transcriptVisible ? "Hide Transcript" : "Show Transcript"}
          </Button>
          <Button variant="ghost" onClick={endSession}>
            End Session
          </Button>
        </div>

        {offline ? <p className="text-xs text-yellow-300">Offline detected.</p> : null}
        {error ? <p className="text-xs text-red-400">Error: {error}</p> : null}
      </header>

      <div className="rounded-2xl bg-surface-card p-4 text-white space-y-2">
        <p className="text-sm text-white/70">Agent state: {agentState}</p>
        <p className="text-xs text-white/50">Streaming UI placeholder</p>
      </div>

      {transcriptVisible ? (
        <div className="space-y-3">
          {bubbles.length === 0 ? (
            <p className="text-sm text-white/60">Transcript will appear here.</p>
          ) : (
            bubbles.map((bubble) => (
              <div key={bubble.id} className="rounded-xl bg-surface-subtle p-3">
                <p className="text-xs text-white/60 uppercase">{bubble.speaker}</p>
                <p className="text-sm">{bubble.text}</p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
