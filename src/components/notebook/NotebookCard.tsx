import React from "react";
import type { NotebookItem } from "../../domains/notes/models";
import { Button } from "../shared/Button";

export interface NotebookCardProps {
  item: NotebookItem;
  draft?: NotebookItem | null;
  isEditing?: boolean;
  isPronouncing?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  onChangeDraft?: (next: Partial<NotebookItem>) => void;
  onPronounce?: (text: string, id: string) => void;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({
  item,
  draft,
  isEditing = false,
  isPronouncing = false,
  onEdit,
  onDelete,
  onCancelEdit,
  onSaveEdit,
  onChangeDraft,
  onPronounce,
}) => {
  const activeItem = isEditing && draft ? draft : item;
  const exampleValue = activeItem.exampleSentences.join("\n");

  const handleExampleChange = (value: string) => {
    const next = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    onChangeDraft?.({ exampleSentences: next });
  };

  return (
    <div className="rounded-2xl bg-white border border-custom-border p-6 shadow-sm text-custom-text-dark space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          {isEditing ? (
            <input
              value={activeItem.phrase}
              onChange={(event) => onChangeDraft?.({ phrase: event.target.value })}
              className="w-full rounded-xl border border-custom-border bg-white px-4 py-2 text-lg font-bold text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
              placeholder="Phrase"
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{activeItem.phrase}</p>
              <button
                type="button"
                onClick={() => onPronounce?.(activeItem.phrase, item.id)}
                disabled={!activeItem.phrase || isPronouncing}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-custom-bg text-custom-text-dark/70 transition-colors hover:text-custom-primary hover:bg-custom-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Play pronunciation"
              >
                <span className="material-symbols-outlined text-lg">
                  {isPronouncing ? "autorenew" : "volume_up"}
                </span>
              </button>
            </div>
          )}
          {isEditing ? (
            <input
              value={activeItem.meaning}
              onChange={(event) => onChangeDraft?.({ meaning: event.target.value })}
              className="w-full rounded-xl border border-custom-border bg-white px-4 py-2 text-sm font-medium text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
              placeholder="Meaning"
            />
          ) : (
            <p className="text-sm text-custom-text-dark/70 font-medium">{activeItem.meaning}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={onSaveEdit}>
                Save
              </Button>
              <Button variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => onEdit?.(item.id)}>
                Edit
              </Button>
              <Button variant="ghost" onClick={() => onDelete?.(item.id)}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={activeItem.usageNotes}
          onChange={(event) => onChangeDraft?.({ usageNotes: event.target.value })}
          rows={3}
          className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-sm text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
          placeholder="Usage notes"
        />
      ) : (
        <p className="text-sm text-custom-text-dark/80 leading-relaxed">{activeItem.usageNotes}</p>
      )}
      {isEditing ? (
        <textarea
          value={exampleValue}
          onChange={(event) => handleExampleChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-custom-border bg-custom-bg px-4 py-3 text-xs text-custom-text-dark/70 placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
          placeholder="Example sentences (one per line)"
        />
      ) : activeItem.exampleSentences.length ? (
        <ul className="list-disc list-inside text-xs text-custom-text-dark/60 space-y-1 bg-custom-bg p-3 rounded-lg">
          {activeItem.exampleSentences.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
