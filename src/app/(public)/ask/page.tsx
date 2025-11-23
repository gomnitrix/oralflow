'use client';

import React, { useState } from "react";
import { ExpressionPreview } from "../../../components/ask/ExpressionPreview";
import { AskService } from "../../../domains/notes/ask-service";
import { NotebookService } from "../../../domains/notes/notebook-service";
import { createInMemoryRepositories } from "../../../services/persistence/repositories";
import { AIClient } from "../../../services/ai/client";
import type { ExpressionSuggestion } from "../../../domains/notes/models";

const repositories = createInMemoryRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });
const askService = new AskService({ aiClient: new AIClient(), notebook: notebookService });

export default function AskPage() {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<ExpressionSuggestion[]>([]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await askService.ask(prompt);
    setSuggestions(result);
  };

  const save = async (suggestion: ExpressionSuggestion) => {
    await askService.saveSuggestion(suggestion);
  };

  return (
    <main className="min-h-screen bg-surface text-white p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Ask</h1>
        <p className="text-white/70">Ask for expressions and save what you like.</p>
      </header>

      <form onSubmit={submit} className="space-y-3">
        <textarea
          className="w-full rounded-lg bg-surface-card p-3 text-white"
          placeholder="How do I decline politely?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Ask
        </button>
      </form>

      {suggestions.length === 0 ? (
        <p className="text-sm text-white/70">Suggestions will appear here.</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <ExpressionPreview key={suggestion.id} suggestion={suggestion} onSave={save} />
          ))}
        </div>
      )}
    </main>
  );
}
