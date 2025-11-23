import React from "react";
import type { ExpressionSuggestion } from "../../domains/notes/models";
import { Button } from "../shared/Button";

export interface ExpressionPreviewProps {
  suggestion: ExpressionSuggestion;
  onSave?: (suggestion: ExpressionSuggestion) => void;
}

export const ExpressionPreview: React.FC<ExpressionPreviewProps> = ({ suggestion, onSave }) => (
  <div className="rounded-2xl bg-surface-card p-4 text-white shadow-card space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold">{suggestion.text}</p>
        <p className="text-sm text-white/70">{suggestion.meaning}</p>
      </div>
      <span className="text-xs uppercase text-white/50">{suggestion.tone}</span>
    </div>
    <p className="text-sm text-white/80">{suggestion.usageNotes}</p>
    <Button variant="secondary" onClick={() => onSave?.(suggestion)}>
      Save to Notebook
    </Button>
  </div>
);
