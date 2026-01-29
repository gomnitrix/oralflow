import React, { useState } from "react";
import type { StructuredNote } from "../../domains/copilot/models";
import type { NotebookItemInput } from "../../lib/validation/notes";

interface TrainingCopilotPanelProps {
  loading: boolean;
  error?: string | null;
  notes: StructuredNote[];
  sourceText: string;
  cardId?: string | null;
  pronunciationScore?: number;
  pronunciationPassed?: boolean;
  pronunciationFeedback?: string;
  onDistill: () => void;
}

const mapStructuredToNotebook = (note: StructuredNote, cardId?: string | null): NotebookItemInput => {
  const now = new Date().toISOString();
  return {
    id: `training_distill_${note.id}`,
    phrase: note.content,
    meaning: note.explanation.zh || note.explanation.en || note.content,
    usageNotes: note.explanation.en,
    variants: [],
    exampleSentences: note.examples,
    contextSentence: note.examples[0] ?? "",
    ipa: "",
    spokenNotes: "",
    source: "training",
    sourceDetails: `trainingDistill:${cardId ?? ""}`,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const TrainingCopilotPanel: React.FC<TrainingCopilotPanelProps> = ({
  loading,
  error,
  notes,
  sourceText,
  cardId,
  pronunciationScore,
  pronunciationPassed,
  pronunciationFeedback,
  onDistill,
}) => {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (note: StructuredNote) => {
    setSavingId(note.id);
    setMessage(null);
    try {
      const payload = mapStructuredToNotebook(note, cardId);
      const response = await fetch("/api/notes/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save note.");
      }
      setSavedIds((prev) => new Set(prev).add(note.id));
      setMessage("Saved to Notebook");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {pronunciationScore !== undefined && (
          <div className="rounded-2xl border border-custom-border bg-custom-bg/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-custom-text-dark/60">Pronunciation</p>
              <span
                className={`text-xs font-semibold ${pronunciationPassed === undefined
                  ? "text-custom-text-dark/60"
                  : pronunciationPassed
                    ? "text-green-600"
                    : "text-red-600"
                  }`}
              >
                {pronunciationPassed === undefined ? "—" : pronunciationPassed ? "Pass" : "Retry"}
              </span>
            </div>
            <p className="text-2xl font-bold text-custom-text-dark">{pronunciationScore}</p>
            {pronunciationFeedback ? (
              <p className="text-xs text-custom-text-dark/70">{pronunciationFeedback}</p>
            ) : null}
          </div>
        )}

        <div className="rounded-2xl border border-custom-border bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-custom-text-dark/60">Selected Text</p>
          <p className="text-sm text-custom-text-dark">{sourceText || "—"}</p>
          <button
            type="button"
            onClick={onDistill}
            disabled={loading}
            className="w-full rounded-xl bg-custom-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-custom-primary/90 disabled:opacity-50"
          >
            {loading ? "Distilling..." : "Distill this card"}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="text-xs text-custom-text-dark/50">No distilled notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-custom-border bg-custom-bg/70 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-custom-text-dark">{note.content}</p>
                    {note.examples[0] && (
                      <p className="text-xs text-custom-text-dark/60 mt-1">Example: {note.examples[0]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSave(note)}
                    disabled={savingId === note.id || savedIds.has(note.id)}
                    className="rounded-full border border-custom-primary/30 bg-white px-2 py-1 text-[11px] font-semibold text-custom-primary hover:bg-custom-primary/10 disabled:opacity-50"
                  >
                    {savingId === note.id ? "Saving..." : savedIds.has(note.id) ? "Saved" : "Save"}
                  </button>
                </div>
                {(note.explanation.en || note.explanation.zh) && (
                  <div className="text-xs text-custom-text-dark/70">
                    {note.explanation.en && <p>EN: {note.explanation.en}</p>}
                    {note.explanation.zh && <p>ZH: {note.explanation.zh}</p>}
                  </div>
                )}
              </div>
            ))
          )}
          {message && <p className="text-xs text-custom-text-dark/60">{message}</p>}
        </div>
      </div>
    </div>
  );
};
