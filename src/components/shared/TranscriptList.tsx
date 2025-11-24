import React from "react";
import type { ConversationBubble } from "../../domains/conversation/models";

export interface TranscriptListProps {
  bubbles: ConversationBubble[];
  onBubbleClick?: (id: string) => void;
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ bubbles, onBubbleClick }) => {
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Failed to play audio:", e));
  };

  return (
    <div className="space-y-6">
      {bubbles.map((bubble) => {
        const isUser = bubble.speaker === "user";
        const isActive = (bubble as any).isActive;

        return (
          <div
            key={bubble.id}
            onClick={() => onBubbleClick?.(bubble.id)}
            className={`flex flex-col gap-1 cursor-pointer transition-all ${isUser ? "items-end" : "items-start"
              }`}
          >
            {/* Speaker Name */}
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1 ${isUser ? "text-custom-primary/80" : "text-custom-text-dark/40"
              }`}>
              {bubble.speaker}
            </span>

            <div className={`relative max-w-[85%] group`}>
              {/* Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border transition-all ${isActive
                    ? "ring-2 ring-custom-primary ring-offset-2"
                    : "hover:shadow-md"
                  } ${isUser
                    ? "bg-custom-primary text-white border-custom-primary rounded-tr-none"
                    : "bg-white text-custom-text-dark border-custom-border rounded-tl-none"
                  }`}
              >
                {bubble.text || (
                  <span className="italic opacity-50">Listening...</span>
                )}
              </div>

              {/* Audio Button (Floating) */}
              {bubble.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(bubble.audioUrl!);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all ${isUser
                      ? "-left-10 bg-white text-custom-primary hover:bg-gray-50"
                      : "-right-10 bg-custom-primary text-white hover:bg-custom-primary/90"
                    }`}
                  title="Play Audio"
                >
                  <span className="material-symbols-outlined text-lg">volume_up</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
