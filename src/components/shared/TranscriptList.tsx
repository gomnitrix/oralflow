import React from "react";
import type { ConversationBubble } from "../../domains/conversation/models";

export interface TranscriptListProps {
  bubbles: ConversationBubble[];
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ bubbles }) => (
  <div className="space-y-3">
    {bubbles.map((bubble) => (
      <div
        key={bubble.id}
        className={`flex items-start gap-2 rounded-xl bg-white border border-custom-border p-4 text-custom-text-dark shadow-sm ${(bubble as any).isActive ? "ring-2 ring-custom-primary" : ""
          }`}
      >
        <span className="text-xs uppercase text-custom-text-dark/60 font-bold tracking-wider">{bubble.speaker}</span>
        <div className="flex-1">
          <p className="text-sm leading-relaxed">{bubble.text || "…"}</p>
          <p className="text-[11px] text-custom-text-dark/40 mt-2">
            State: {bubble.state} · Updated: {bubble.updatedAt}
          </p>
        </div>
      </div>
    ))}
  </div>
);
