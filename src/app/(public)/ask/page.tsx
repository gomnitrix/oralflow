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
    <main className="p-8 lg:p-12 space-y-8">
      <header>
        <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Ask</h1>
        <p className="text-custom-text-dark/60 text-base font-normal leading-normal">Ask for expressions and save what you like.</p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <textarea
          className="w-full rounded-lg bg-white border border-custom-border p-4 text-custom-text-dark placeholder:text-custom-text-dark/40 focus:ring-2 focus:ring-custom-primary focus:border-transparent outline-none transition-all"
          placeholder="How do I decline politely?"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-full bg-custom-primary px-6 py-3 text-sm font-bold text-white hover:bg-custom-primary/90 transition-colors"
        >
          Ask
        </button>
      </form>

      {suggestions.length === 0 ? (
        <p className="text-custom-text-dark/60 text-sm">Suggestions will appear here.</p>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <ExpressionPreview key={suggestion.id} suggestion={suggestion} onSave={save} />
          ))}
        </div>
      )}
    </main>
  );
}
