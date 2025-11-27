import React, { useCallback, useEffect, useMemo, useState } from "react";

import type { ConversationBubble } from "../../domains/conversation/models";
import type { StructuredNote } from "../../domains/copilot/models";
import type { NotebookItemInput } from "../../lib/validation/notes";

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

const InsightList: React.FC<{ title: string; insights: ConversationBubble["copilotInsights"]; badge?: string; bubbleId?: string }>
  = ({ title, insights, badge, bubbleId }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-custom-text-dark">{title}</p>
        {badge && <span className="text-[10px] font-semibold text-custom-text-dark/60 uppercase">{badge}</span>}
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-custom-text-dark/50">Run Copilot to generate suggestions.</p>
      ) : (
        insights.map((insight) => (
          <div key={insight.id} className="rounded-2xl border border-custom-border bg-[#f4f5f7] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{insight.type === "distill" ? "🔎" : "⚡️"}</span>
              <div>
                <p className="text-sm font-bold text-custom-text-dark">{insight.title}</p>
                <p className="text-xs text-custom-text-dark/60">{insight.description}</p>
              </div>
            </div>

            <StructuredGrid
              notes={insight.structuredNotes ?? []}
              fallback={insight.suggestedExpressions}
              origin={insight.type === "distill" ? "stwDistill" : "stwInspiration"}
              bubbleId={bubbleId}
            />
          </div>
        ))
      )}
    </div>
  );

const mapStructuredToNotebook = (
  note: StructuredNote,
  source: "stwDistill" | "stwInspiration",
  bubbleId?: string
): NotebookItemInput => {
  const now = new Date().toISOString();
  return {
    id: `${source}_${note.id}`,
    phrase: note.content,
    meaning: note.explanation.zh || note.explanation.en || note.content,
    usageNotes: note.explanation.en,
    variants: [],
    exampleSentences: note.examples,
    contextSentence: note.examples[0] ?? "",
    ipa: "",
    spokenNotes: "",
    source: "stw",
    sourceDetails: `${source}:${bubbleId ?? ""}`,
    createdAt: now,
    updatedAt: now,
  };
};

const StructuredGrid: React.FC<{
  notes: StructuredNote[];
  fallback?: ConversationBubble["copilotInsights"][number]["suggestedExpressions"];
  origin: "stwDistill" | "stwInspiration";
  bubbleId?: string;
}>
  = ({ notes, fallback, origin, bubbleId }) => {
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState<string | null>(null);

    const saveNote = async (note: StructuredNote) => {
      setSavingId(note.id);
      setMessage(null);
      try {
        const payload = mapStructuredToNotebook(note, origin, bubbleId);
        const response = await fetch("/api/notes/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to save note");
        }
        setMessage("Saved to Notebook");
        setSavedIds((prev) => new Set(prev).add(note.id));
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setSavingId(null);
      }
    };

    if (!notes.length && fallback?.length) {
      return (
        <div className="space-y-2">
          {fallback.map((expr) => (
            <div key={expr.id} className="rounded-xl bg-white border border-custom-border px-3 py-2">
              <p className="text-sm font-semibold text-custom-text-dark">{expr.text}</p>
              <p className="text-xs text-custom-text-dark/60">{expr.meaning}</p>
              {expr.examples.length > 0 && (
                <p className="text-xs text-custom-text-dark/50 mt-1">Example: {expr.examples[0]}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative rounded-2xl bg-[#f9fafb] border border-custom-border/80 px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:z-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-custom-text-dark">{note.content}</p>
                {note.examples[0] && (
                  <p className="text-xs text-custom-text-dark/60 mt-1">Example: {note.examples[0]}</p>
                )}
              </div>
              <button
                className="text-xs font-semibold text-custom-primary bg-white/70 border border-custom-primary/30 rounded-full px-2 py-1 hover:bg-custom-primary/10 transition-colors disabled:opacity-50"
                onClick={() => saveNote(note)}
                disabled={savingId === note.id || savedIds.has(note.id)}
              >
                {savingId === note.id ? "Saving..." : savedIds.has(note.id) ? "Saved" : "Save"}
              </button>
            </div>

            <div className="absolute left-0 right-0 top-full mt-2 hidden group-hover:block z-50">
              <div className="rounded-2xl bg-white border border-custom-border shadow-xl p-4 space-y-2 relative z-50">
                <p className="text-xs font-semibold text-custom-text-dark/60 uppercase">Explanation</p>
                <p className="text-sm text-custom-text-dark">EN: {note.explanation.en || ""}</p>
                <p className="text-sm text-custom-text-dark">ZH: {note.explanation.zh || ""}</p>
                {note.examples.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <p className="text-xs font-semibold text-custom-text-dark/60 uppercase">Examples</p>
                    {note.examples.map((ex, idx) => (
                      <p key={idx} className="text-sm text-custom-text-dark/80 leading-snug">• {ex}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {message && <p className="text-xs text-custom-text-dark/60">{message}</p>}
      </div>
    );
  };

const ScorePill: React.FC<{ label: string; value?: number }> = ({ label, value }) => (
  <div className="rounded-xl bg-white border border-custom-border px-3 py-2 flex items-center justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-custom-text-dark/60">{label}</span>
    <span className="text-sm font-bold text-custom-text-dark">{value !== undefined ? Math.round(value) : "—"}</span>
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
  const summary = selectedBubble?.evaluationSummary;

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
                  {!summary.pronunciationEnabled && (
                    <p className="text-sm text-custom-text-dark/60 mt-1">
                      {summary.pronunciationIssues[0] || "Pronunciation assessment not enabled."}
                    </p>
                  )}
                  {summary.pronunciationEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <ScorePill label="Pronunciation" value={summary.pronunciationScores?.overall} />
                        <ScorePill label="Accuracy" value={summary.pronunciationScores?.accuracy} />
                        <ScorePill label="Fluency" value={summary.pronunciationScores?.fluency} />
                        <ScorePill label="Completeness" value={summary.pronunciationScores?.completeness} />
                        {summary.pronunciationScores?.prosody !== undefined && (
                          <ScorePill label="Prosody" value={summary.pronunciationScores?.prosody} />
                        )}
                      </div>

                      {(summary.wordScores ?? []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold text-custom-text-dark/60 uppercase mb-1">Pronunciation</p>
                          <div className="leading-7 text-sm flex flex-wrap gap-2">
                            {(summary.wordScores ?? []).map((word, idx) => {
                              const wordScore = word.accuracy ?? 0;
                              const wordColor =
                                wordScore >= 90 ? "text-green-700" : wordScore >= 75 ? "text-amber-700" : "text-red-700";
                              const phonemes = word.phonemes ?? [];
                              const ipaPieces = phonemes.map((p) => p.ipa || p.phoneme);
                              return (
                                <div
                                  key={`${word.word}-${idx}`}
                                  className="relative group flex flex-col items-center min-w-[70px] px-1 hover:z-50"
                                >
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-custom-text-dark/50">/</span>
                                    {phonemes.map((p, pIdx) => {
                                      const score = p.accuracy ?? 0;
                                      const color =
                                        score >= 90 ? "text-green-600" : score >= 75 ? "text-amber-600" : "text-red-600";
                                      return (
                                        <span key={`${word.word}-phoneme-${p.phoneme}-${pIdx}`} className={`${color} font-semibold`}>
                                          {p.ipa || p.phoneme}
                                        </span>
                                      );
                                    })}
                                    <span className="text-custom-text-dark/50">/</span>
                                  </div>
                                  <span
                                    className={`font-semibold ${wordColor}`}
                                  >
                                    {word.word}
                                  </span>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap rounded-md bg-black text-white text-[11px] px-2 py-1 shadow z-50">
                                    {`${word.word}: ${wordScore}/100${word.errorType && word.errorType !== "None" ? ` · ${word.errorType}` : ""}`}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {summary.referenceAudioUrl && (
                        <button
                          className="mt-3 text-xs font-semibold text-custom-primary bg-white border border-custom-primary/30 rounded-full px-3 py-1 hover:bg-custom-primary/10 transition-colors"
                          onClick={() => {
                            if (typeof Audio === "undefined") return;
                            const audio = new Audio(summary.referenceAudioUrl || "");
                            void audio.play().catch(() => undefined);
                          }}
                        >
                          Replay reference audio
                        </button>
                      )}
                    </>
                  )}
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
              <p className="text-custom-text-dark text-sm font-medium leading-relaxed">“{selectedBubble.text}”</p>
            </div>

            <button
              className="w-full py-3 bg-custom-primary text-white rounded-xl font-bold text-sm hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20 disabled:opacity-50"
              onClick={() => onDistill?.()}
              disabled={loading}
            >
              {loading ? "Working..." : "Distill this turn"}
            </button>

            <InsightList
              title="Key Vocabulary"
              insights={distillInsights}
              badge={distillInsights.length ? "Stored" : undefined}
              bubbleId={selectedBubble?.id}
            />
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

            <InsightList
              title="Ideas"
              insights={inspirationInsights}
              badge={inspirationInsights.length ? "Saved" : undefined}
              bubbleId={selectedBubble?.id}
            />
          </div>
        )}
      </div>
    </div>
  );
};
