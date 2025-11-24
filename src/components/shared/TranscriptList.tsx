import React from "react";
import type { ConversationBubble } from "../../domains/conversation/models";

export interface TranscriptListProps {
  bubbles: ConversationBubble[];
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ bubbles }) => {
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Failed to play audio:", e));
  };

  return (
    <div className="space-y-3">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`flex items-start gap-3 rounded-xl bg-white border border-custom-border p-4 text-custom-text-dark shadow-sm transition-all ${(bubble as any).isActive ? "ring-2 ring-custom-primary shadow-md" : "hover:border-custom-primary/30"
            }`}
        >
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className="text-xs uppercase text-custom-text-dark/60 font-bold tracking-wider">{bubble.speaker}</span>
            {bubble.audioUrl && (
              <button
                onClick={() => playAudio(bubble.audioUrl!)}
                className="w-8 h-8 rounded-full bg-custom-primary/10 flex items-center justify-center text-custom-primary hover:bg-custom-primary hover:text-white transition-colors"
                title="Play Audio"
              >
                <span className="material-symbols-outlined text-lg">volume_up</span>
              </button>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm leading-relaxed">{bubble.text || "…"}</p>
            {/* Debug info - can be removed or hidden in prod */}
            {/* <p className="text-[11px] text-custom-text-dark/40 mt-2">
              State: {bubble.state}
            </p> */}
          </div>
        </div>
      ))}
    </div>
  );
};
