import React, { useEffect, useState } from "react";
import type { ExpressionSuggestion } from "../../domains/notes/models";
import { Button } from "../shared/Button";

export interface ExpressionPreviewProps {
  suggestion: ExpressionSuggestion;
  onSave?: (suggestion: ExpressionSuggestion) => void;
}

export const ExpressionPreview: React.FC<ExpressionPreviewProps> = ({ suggestion, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ExpressionSuggestion>(suggestion);

  useEffect(() => {
    setDraft(suggestion);
    setIsEditing(false);
  }, [suggestion]);

  const examplesValue = draft.examples.join("\n");

  const updateDraft = (next: Partial<ExpressionSuggestion>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  };

  const updateExamples = (value: string) => {
    const examples = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    updateDraft({ examples });
  };

  return (
    <div className="rounded-2xl bg-white border border-custom-border p-6 shadow-sm text-custom-text-dark space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          {isEditing ? (
            <>
              <input
                value={draft.text}
                onChange={(event) => updateDraft({ text: event.target.value })}
                className="w-full rounded-xl border border-custom-border bg-white px-4 py-2 text-lg font-bold text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                placeholder="Phrase"
              />
              <input
                value={draft.meaning}
                onChange={(event) => updateDraft({ meaning: event.target.value })}
                className="w-full rounded-xl border border-custom-border bg-white px-4 py-2 text-sm font-medium text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                placeholder="Meaning"
              />
            </>
          ) : (
            <>
              <p className="text-lg font-bold">{draft.text}</p>
              <p className="text-sm text-custom-text-dark/70 font-medium">{draft.meaning}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-custom-bg text-custom-text-dark/60 hover:text-custom-primary hover:bg-custom-primary/10 transition-colors"
          aria-label={isEditing ? "Finish editing" : "Edit suggestion"}
        >
          <span className="material-symbols-outlined text-lg">{isEditing ? "check" : "edit"}</span>
        </button>
      </div>
      {isEditing ? (
        <textarea
          value={draft.usageNotes}
          onChange={(event) => updateDraft({ usageNotes: event.target.value })}
          rows={3}
          className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-sm text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
          placeholder="Usage notes"
        />
      ) : (
        <p className="text-sm text-custom-text-dark/80 leading-relaxed">{draft.usageNotes}</p>
      )}
      {isEditing ? (
        <textarea
          value={examplesValue}
          onChange={(event) => updateExamples(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-custom-border bg-custom-bg px-4 py-3 text-xs text-custom-text-dark/70 placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
          placeholder="Example sentences (one per line)"
        />
      ) : draft.examples.length ? (
        <ul className="list-disc list-inside text-xs text-custom-text-dark/60 space-y-1 bg-custom-bg p-3 rounded-lg">
          {draft.examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      ) : null}
      <Button variant="secondary" onClick={() => onSave?.(draft)}>
        Save to Notebook
      </Button>
    </div>
  );
};
