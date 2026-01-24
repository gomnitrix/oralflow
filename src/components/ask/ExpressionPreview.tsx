import React from "react";
import type { ExpressionSuggestion } from "../../domains/notes/models";
import { Button } from "../shared/Button";

export interface ExpressionPreviewProps {
  suggestion: ExpressionSuggestion;
  onSave?: (suggestion: ExpressionSuggestion) => void;
}

export const ExpressionPreview: React.FC<ExpressionPreviewProps> = ({ suggestion, onSave }) => (
  <div className="rounded-2xl bg-white border border-custom-border p-6 shadow-sm text-custom-text-dark space-y-3 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-bold">{suggestion.text}</p>
        <p className="text-sm text-custom-text-dark/70 font-medium">{suggestion.meaning}</p>
      </div>
    </div>
    <p className="text-sm text-custom-text-dark/80 leading-relaxed">{suggestion.usageNotes}</p>
    {suggestion.examples.length ? (
      <ul className="list-disc list-inside text-xs text-custom-text-dark/60 space-y-1 bg-custom-bg p-3 rounded-lg">
        {suggestion.examples.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
    ) : null}
    <Button variant="secondary" onClick={() => onSave?.(suggestion)}>
      Save to Notebook
    </Button>
  </div>
);
