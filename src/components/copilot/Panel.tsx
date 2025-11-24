import React, { useState, useEffect } from "react";

import type { ConversationBubble } from "../../domains/conversation/models";

interface CopilotPanelProps {
  mode?: "standard" | "assessment";
  selectedBubble?: ConversationBubble;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ mode = "standard", selectedBubble }) => {
  const [activeTab, setActiveTab] = useState<"distill" | "inspiration">("distill");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "h") setActiveTab("distill");
      if (event.key.toLowerCase() === "l") setActiveTab("inspiration");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // If in assessment mode (user recorded but hasn't sent), override content
  if (mode === "assessment") {
    return (
      <div className="flex flex-col h-full bg-custom-bg border-l border-custom-border">
        <div className="p-6 pb-4 border-b border-custom-border/50">
          <h2 className="text-xl font-black text-custom-text-dark tracking-tight">Copilot Coach</h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-custom-border border-l-4 border-l-custom-primary animate-in fade-in slide-in-from-right-4">
            <p className="text-xs font-bold text-custom-primary uppercase tracking-wider mb-3">Pre-send Evaluation</p>
            <p className="text-custom-text-dark font-medium mb-6 text-lg">Your response is ready to send.</p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-custom-text-dark">Pronunciation</p>
                  <p className="text-sm text-custom-text-dark/70 mt-1">Clear and intelligible.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-custom-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-custom-primary text-lg">lightbulb</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-custom-text-dark">Suggestion</p>
                  <p className="text-sm text-custom-text-dark/70 mt-1">Try adding &quot;s&apos;il vous plaît&quot; for more politeness.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-custom-bg border-l border-custom-border">
      {/* Header / Title */}
      <div className="p-6 pb-4 border-b border-custom-border/50">
        <h2 className="text-xl font-black text-custom-text-dark tracking-tight">Copilot Coach</h2>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4">
        <div className="flex p-1 bg-white rounded-full border border-custom-border shadow-sm">
          <button
            onClick={() => setActiveTab("distill")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === "distill"
              ? "bg-custom-text-dark text-white shadow-md"
              : "text-custom-text-dark/60 hover:bg-gray-50"
              }`}
          >
            Distill (H)
          </button>
          <button
            onClick={() => setActiveTab("inspiration")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === "inspiration"
              ? "bg-custom-text-dark text-white shadow-md"
              : "text-custom-text-dark/60 hover:bg-gray-50"
              }`}
          >
            Inspiration (L)
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "distill" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {selectedBubble ? (
              <>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-custom-border">
                  <p className="text-xs font-bold text-custom-text-dark/40 uppercase tracking-wider mb-3">Selected Text</p>
                  <p className="text-custom-text-dark text-lg font-medium leading-relaxed">
                    &quot;{selectedBubble.text}&quot;
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-custom-border">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-custom-text-dark">Key Vocabulary</p>
                    <button className="text-xs font-bold text-custom-primary bg-custom-primary/10 px-3 py-1 rounded-full hover:bg-custom-primary/20 transition-colors">
                      Distill All
                    </button>
                  </div>
                  <p className="text-sm text-custom-text-dark/60 italic">
                    Click &quot;Distill&quot; to extract vocabulary from this bubble.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-custom-border text-center py-12">
                <span className="material-symbols-outlined text-4xl text-custom-text-dark/20 mb-3">touch_app</span>
                <p className="text-custom-text-dark/60 font-medium">Select a bubble to analyze</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "inspiration" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-custom-border">
              <p className="text-sm font-bold text-custom-text-dark mb-3">Need a hint?</p>
              <input
                type="text"
                placeholder="Type what you want to say..."
                className="w-full p-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-custom-primary/20 text-sm outline-none transition-all"
              />
              <button className="w-full mt-4 py-3 bg-custom-primary text-white rounded-xl font-bold text-sm hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20">
                Inspire Me
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100/50">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Quick Tip</p>
              <p className="text-sm text-indigo-900/80 font-medium">
                Try using &quot;Je voudrais...&quot; instead of &quot;Je veux...&quot; to sound more polite.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
