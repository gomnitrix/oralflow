import React from "react";
import type { ConversationBubble } from "../../domains/conversation/models";

export interface TranscriptListProps {
  bubbles: ConversationBubble[];
  onBubbleClick?: (id: string) => void;
  speakerLabels?: { user: string; ai: string };
  userAvatarUrl?: string;
}

const AI_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDKwpxleXsknFFucb_wNgxEnE3VXJ52Mv1-DrdF9VZI6Z76ngJm5DLDw4eBnD881E7M38dSacAKr76YZuBVhIKXwVomUeld1clqBoJikOknBiO88ButxebP7dWKLUlu9-szSq0S97Mn7TPLGDW9rp3gecAvCwnXLaO2Z6pZ6XFywRZiQrn8_zExjFYmHGWj94Oge-mzbEEaTEqqeywVGZCwrNFaZ2AWJLdr854orewqLDhQ4keLe-1lfXPTyMak8QoaTUWdYy-GPf0";
const USER_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDKwpxleXsknFFucb_wNgxEnE3VXJ52Mv1-DrdF9VZI6Z76ngJm5DLDw4eBnD881E7M38dSacAKr76YZuBVhIKXwVomUeld1clqBoJikOknBiO88ButxebP7dWKLUlu9-szSq0S97Mn7TPLGDW9rp3gecAvCwnXLaO2Z6pZ6XFywRZiQrn8_zExjFYmHGWj94Oge-mzbEEaTEqqeywVGZCwrNFaZ2AWJLdr854orewqLDhQ4keLe-1lfXPTyMak8QoaTUWdYy-GPf0";

export const TranscriptList: React.FC<TranscriptListProps> = ({ bubbles, onBubbleClick, speakerLabels, userAvatarUrl }) => {
  const resolvedUserAvatar = userAvatarUrl?.trim() ? userAvatarUrl : USER_AVATAR_URL;
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Failed to play audio:", e));
  };

  const TypingIndicator: React.FC = () => (
    <span className="inline-flex items-center gap-1 text-sm opacity-60">
      <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0ms]"></span>
      <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:120ms]"></span>
      <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:240ms]"></span>
    </span>
  );

  return (
    <div className="space-y-6">
      {bubbles.map((bubble) => {
        const isUser = bubble.speaker === "user";
        const isActive = (bubble as any).isActive;
        const isUnsentUser = isUser && bubble.state !== "sent";

        return (
          <div
            key={bubble.id}
            onClick={() => onBubbleClick?.(bubble.id)}
            className={`flex gap-3 cursor-pointer transition-all items-end ${isUser ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar (Left) */}
            {!isUser && (
              <div
                className="w-10 h-10 rounded-full bg-cover bg-center shrink-0 shadow-sm"
                style={{ backgroundImage: `url(${AI_AVATAR_URL})`, filter: 'hue-rotate(200deg) saturate(0.8)' }}
              />
            )}

            <div className={`flex flex-col gap-1 max-w-[85%] group ${isUser ? "items-end" : "items-start"}`}>
              {/* Speaker Name */}
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1 ${isUser ? "text-custom-primary/80" : "text-custom-text-dark/40"
                }`}>
                {bubble.speaker === "ai" ? speakerLabels?.ai ?? "AI" : speakerLabels?.user ?? "User"}
              </span>

              <div className="relative">
                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border transition-all ${isActive
                    ? "ring-2 ring-custom-primary ring-offset-2"
                    : "hover:shadow-md"
                    } ${isUser
                      ? `bg-custom-primary text-white border-custom-primary rounded-br-none ${isUnsentUser ? "ring-1 ring-offset-2 ring-custom-primary/60 animate-pulse" : ""}`
                      : "bg-white text-custom-text-dark border-custom-border rounded-bl-none"
                    }`}
                >
                  {bubble.text ? bubble.text : <TypingIndicator />}
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

            {/* User Avatar (Right) */}
            {isUser && (
              <div
                className="w-10 h-10 rounded-full bg-cover bg-center shrink-0 shadow-sm"
                style={{ backgroundImage: `url(${resolvedUserAvatar})` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
