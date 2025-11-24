import React, { useState, useEffect } from "react";

interface CopilotPanelProps {
  mode?: "standard" | "assessment";
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ mode = "standard" }) => {
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
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-custom-text-dark">Copilot Coach</h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-custom-border border-l-4 border-l-custom-primary animate-in fade-in slide-in-from-right-4">
            <p className="text-sm font-bold text-custom-primary uppercase mb-2">Pre-send Evaluation</p>
            <p className="text-custom-text-dark font-medium mb-4">Your response is ready to send.</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                <div>
                  <p className="text-sm font-bold text-custom-text-dark">Pronunciation</p>
                  <p className="text-xs text-custom-text-dark/70">Clear and intelligible.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-custom-primary mt-0.5">lightbulb</span>
                <div>
                  <p className="text-sm font-bold text-custom-text-dark">Suggestion</p>
                  <p className="text-xs text-custom-text-dark/70">Try adding &quot;s&apos;il vous plaît&quot; for more politeness.</p>
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
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-custom-text-dark">Copilot Coach</h2>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-2">
        <button
          onClick={() => setActiveTab("distill")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === "distill"
            ? "bg-custom-text-dark text-white shadow-md"
            : "bg-white text-custom-text-dark/60 hover:bg-custom-primary/5"
            }`}
        >
          Distill (H)
        </button>
        <button
          onClick={() => setActiveTab("inspiration")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === "inspiration"
            ? "bg-custom-text-dark text-white shadow-md"
            : "bg-white text-custom-text-dark/60 hover:bg-custom-primary/5"
            }`}
        >
          Inspiration Burst (L)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "distill" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-custom-border">
              <p className="text-sm font-bold text-custom-text-dark mb-2">Analysis</p>
              <p className="text-custom-text-dark/80 text-sm leading-relaxed">
                Select a bubble to see a detailed breakdown of vocabulary and grammar.
              </p>
            </div>
            {/* Placeholder for Distill cards */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-custom-border opacity-60">
              <p className="text-xs font-bold text-custom-primary uppercase mb-1">Suggestion 1</p>
              <p className="text-custom-text-dark font-medium">Coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === "inspiration" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-custom-border">
              <p className="text-sm font-bold text-custom-text-dark mb-3">Need a hint?</p>
              <input
                type="text"
                placeholder="Type what you want to say..."
                className="w-full p-3 rounded-xl bg-custom-bg border-none text-sm focus:ring-2 focus:ring-custom-primary/20 outline-none transition-all"
              />
              <button className="w-full mt-3 py-2 bg-custom-primary text-white rounded-xl font-bold text-sm hover:bg-custom-primary/90 transition-colors">
                Inspire Me
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
