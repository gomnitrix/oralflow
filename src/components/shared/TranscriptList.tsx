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
        className={`flex items-start gap-2 rounded-xl bg-surface-subtle p-3 text-white ${
          (bubble as any).isActive ? "ring-2 ring-accent" : ""
        }`}
      >
        <span className="text-xs uppercase text-white/60">{bubble.speaker}</span>
        <div className="flex-1">
          <p className="text-sm">{bubble.text || "…"}</p>
          <p className="text-[11px] text-white/50 mt-1">
            State: {bubble.state} · Updated: {bubble.updatedAt}
          </p>
        </div>
      </div>
    ))}
  </div>
);
