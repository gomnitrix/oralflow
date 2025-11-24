import React from "react";
import type { NotebookItem } from "../../domains/notes/models";
import { Button } from "../shared/Button";

export interface NotebookCardProps {
  item: NotebookItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({ item, onEdit, onDelete }) => (
  <div className="rounded-2xl bg-white border border-custom-border p-6 shadow-sm text-custom-text-dark space-y-3 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-bold">{item.phrase}</p>
        <p className="text-sm text-custom-text-dark/70 font-medium">{item.meaning}</p>
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
    <p className="text-sm text-custom-text-dark/80 leading-relaxed">{item.usageNotes}</p>
    {item.exampleSentences.length ? (
      <ul className="list-disc list-inside text-xs text-custom-text-dark/60 space-y-1 bg-custom-bg p-3 rounded-lg">
        {item.exampleSentences.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
    ) : null}
  </div>
);
