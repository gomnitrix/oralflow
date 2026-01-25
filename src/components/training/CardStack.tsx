import React from "react";
import type { ReviewCard } from "../../domains/training/models";

interface CardStackProps {
  next?: ReviewCard | null;
  children: React.ReactNode;
}

export const CardStack: React.FC<CardStackProps> = ({ next, children }) => {
  return (
    <div className="relative w-full">
      {next && (
        <div className="absolute inset-0 translate-y-4 scale-[0.98] rotate-1 rounded-3xl border border-custom-border bg-white/90 shadow-sm">
          <div className="p-6 opacity-50">
            <p className="text-xs uppercase tracking-[0.2em] text-custom-text-dark/50">Next</p>
            <p className="text-lg font-semibold text-custom-text-dark">{next.content.front.title}</p>
            <p className="text-sm text-custom-text-dark/60">{next.content.front.prompt}</p>
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
