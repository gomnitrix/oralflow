import React, { useCallback, useEffect, useMemo, useState } from "react";

import type { ConversationBubble } from "../../domains/conversation/models";

interface CopilotPanelProps {
  mode?: "standard" | "assessment";
  selectedBubble?: ConversationBubble;
  onDistill?: () => void | Promise<void>;
  onInspiration?: (prompt?: string) => void | Promise<void>;
  loading?: boolean;
}

type Tab = "distill" | "inspiration";

const useBubbleContext = (bubbleId?: string) => {
  const [contexts, setContexts] = useState<Record<string, { activeTab: Tab; inputValue: string }>>({});

  const context = useMemo(() => {
    if (!bubbleId) return { activeTab: "distill" as Tab, inputValue: "" };
    return contexts[bubbleId] ?? { activeTab: "distill" as Tab, inputValue: "" };
  }, [bubbleId, contexts]);

  const updateContext = useCallback(
    (updates: Partial<{ activeTab: Tab; inputValue: string }>) => {
      if (!bubbleId) return;
      setContexts((prev) => {
        const current = prev[bubbleId] ?? { activeTab: "distill" as Tab, inputValue: "" };
        return { ...prev, [bubbleId]: { ...current, ...updates } };
      });
    },
    [bubbleId]
  );

  return { context, updateContext };
};

const InsightList: React.FC<{ title: string; insights: ConversationBubble["copilotInsights"]; badge?: string }>
  = ({ title, insights, badge }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-custom-text-dark">{title}</p>
        {badge && <span className="text-[10px] font-semibold text-custom-text-dark/60 uppercase">{badge}</span>}
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-custom-text-dark/50">Run Copilot to generate suggestions.</p>
      ) : (
        insights.map((insight) => (
          <div key={insight.id} className="rounded-2xl border border-custom-border bg-[#f8f6f6] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{insight.type === "distill" ? "🔎" : "⚡️"}</span>
              <div>
                <p className="text-sm font-bold text-custom-text-dark">{insight.title}</p>
                <p className="text-xs text-custom-text-dark/60">{insight.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              {insight.suggestedExpressions.map((expr) => (
                <div key={expr.id} className="rounded-xl bg-white border border-custom-border px-3 py-2">
                  <p className="text-sm font-semibold text-custom-text-dark">{expr.text}</p>
                  <p className="text-xs text-custom-text-dark/60">{expr.meaning}</p>
                  {expr.examples.length > 0 && (
                    <p className="text-xs text-custom-text-dark/50 mt-1">Example: {expr.examples[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  mode = "standard",
  selectedBubble,
  onDistill,
  onInspiration,
  loading = false,
}) => {
  const { context, updateContext } = useBubbleContext(selectedBubble?.id);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!selectedBubble) return;
      if (event.key.toLowerCase() === "h") updateContext({ activeTab: "distill" });
      if (event.key.toLowerCase() === "l") updateContext({ activeTab: "inspiration" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedBubble, updateContext]);

  const distillInsights = (selectedBubble?.copilotInsights ?? []).filter((i) => i.type === "distill");
  const inspirationInsights = (selectedBubble?.copilotInsights ?? []).filter((i) => i.type === "inspiration");

  if (mode === "assessment") {
    const summary = selectedBubble?.evaluationSummary;
    return (
      <div className="flex flex-col h-full bg-white border-l border-custom-border">
        <div className="p-6 pb-4 border-b border-custom-border/50">
          <h2 className="text-xl font-black text-custom-text-dark tracking-tight">Copilot Coach</h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {summary ? (
            <div className="bg-[#f8f6f6] p-6 rounded-3xl shadow-sm border border-custom-border space-y-4">
              <p className="text-xs font-bold text-custom-text-dark/60 uppercase tracking-wider">Pre-send Evaluation</p>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-custom-text-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500 text-base">mic</span>
                    Pronunciation
                  </p>
                  <ul className="text-sm text-custom-text-dark/70 list-disc list-inside mt-1 space-y-1">
                    {summary.pronunciationIssues.length > 0 ? (
                      summary.pronunciationIssues.map((issue, idx) => <li key={idx}>{issue}</li>)
                    ) : (
                      <li>Sounding clear.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-bold text-custom-text-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-base">auto_fix</span>
                    Grammar & Naturalness
                  </p>
                  <ul className="text-sm text-custom-text-dark/70 list-disc list-inside mt-1 space-y-1">
                    {[...summary.grammarIssues, ...summary.naturalnessNotes].map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-custom-border px-4 py-3">
                  <p className="text-xs font-bold text-custom-text-dark/60 uppercase">A native speaker would say</p>
                  <p className="text-sm text-custom-text-dark mt-1">{summary.nativeLikeSuggestion}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#f8f6f6] p-6 rounded-3xl border border-dashed border-custom-border text-center">
              <p className="text-sm font-medium text-custom-text-dark/70">Evaluating your response...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-custom-border">
      <div className="p-6 pb-4 border-b border-custom-border/50">
        <h2 className="text-xl font-black text-custom-text-dark tracking-tight">Copilot Coach</h2>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-full">
          <button
            onClick={() => updateContext({ activeTab: "distill" })}
            className={`py-2 px-4 rounded-full text-sm font-bold transition-all ${context.activeTab === "distill"
              ? "bg-white text-custom-text-dark shadow-sm"
              : "text-custom-text-dark/60 hover:text-custom-text-dark"
              }`}
          >
            Distill
          </button>
          <button
            onClick={() => updateContext({ activeTab: "inspiration" })}
            className={`py-2 px-4 rounded-full text-sm font-bold transition-all ${context.activeTab === "inspiration"
              ? "bg-white text-custom-text-dark shadow-sm"
              : "text-custom-text-dark/60 hover:text-custom-text-dark"
              }`}
          >
            Inspiration Burst
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto" key={selectedBubble?.id}>
        {!selectedBubble ? (
          <div className="bg-[#f8f6f6] p-6 rounded-3xl shadow-sm border border-custom-border text-center py-12">
            <span className="material-symbols-outlined text-4xl text-custom-text-dark/20 mb-3">touch_app</span>
            <p className="text-custom-text-dark/60 font-medium">Select a bubble to analyze</p>
          </div>
        ) : context.activeTab === "distill" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#f8f6f6] p-6 rounded-3xl shadow-sm border border-custom-border">
              <p className="text-xs font-bold text-custom-text-dark/40 uppercase tracking-wider mb-3">Selected Text</p>
              <p className="text-custom-text-dark text-lg font-medium leading-relaxed">“{selectedBubble.text}”</p>
            </div>

            <button
              className="w-full py-3 bg-custom-primary text-white rounded-xl font-bold text-sm hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20 disabled:opacity-50"
              onClick={() => onDistill?.()}
              disabled={loading}
            >
              {loading ? "Working..." : "Distill this turn"}
            </button>

            <InsightList title="Key Vocabulary" insights={distillInsights} badge={distillInsights.length ? "Stored" : undefined} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#f8f6f6] p-6 rounded-3xl shadow-sm border border-custom-border">
              <p className="text-sm font-bold text-custom-text-dark mb-3">Need a hint?</p>
              <input
                type="text"
                value={context.inputValue}
                onChange={(e) => updateContext({ inputValue: e.target.value })}
                placeholder="Type what you want to say..."
                className="w-full p-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-custom-primary/20 text-sm outline-none transition-all"
              />
              <button
                className="w-full mt-4 py-3 bg-custom-primary text-white rounded-xl font-bold text-sm hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20 disabled:opacity-50"
                onClick={() => onInspiration?.(context.inputValue || selectedBubble.text)}
                disabled={loading}
              >
                {loading ? "Generating..." : "Inspire Me"}
              </button>
            </div>

            <InsightList title="Ideas" insights={inspirationInsights} badge={inspirationInsights.length ? "Saved" : undefined} />
          </div>
        )}
      </div>
    </div>
  );
};
