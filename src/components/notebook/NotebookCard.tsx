import React from "react";
import type { NotebookItem } from "../../domains/notes/models";
import { Button } from "../shared/Button";

export interface NotebookCardProps {
  item: NotebookItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({ item, onEdit, onDelete }) => (
  <div className="rounded-2xl bg-surface-card p-4 shadow-card text-white space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold">{item.phrase}</p>
        <p className="text-sm text-white/70">{item.meaning}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onEdit?.(item.id)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onDelete?.(item.id)}>
          Delete
        </Button>
      </div>
    </div>
    <p className="text-sm text-white/80">{item.usageNotes}</p>
    {item.exampleSentences.length ? (
      <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
        {item.exampleSentences.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
    ) : null}
  </div>
);
