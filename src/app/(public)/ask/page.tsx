'use client';

import React, { useState } from "react";
import { ExpressionPreview } from "../../../components/ask/ExpressionPreview";
import type { ExpressionSuggestion } from "../../../domains/notes/models";

interface AskResponse {
  suggestions: ExpressionSuggestion[];
  error?: string;
}

export default function AskPage() {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<ExpressionSuggestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt to ask for suggestions.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await response.json().catch(() => null)) as AskResponse | null;

      if (!response.ok || !data) {
        throw new Error(data?.error ?? "Failed to generate suggestions.");
      }

      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const save = async (suggestion: ExpressionSuggestion) => {
    try {
      setError(null);
      const response = await fetch("/api/ask/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suggestion),
      });
      const data = (await response.json().catch(() => null)) as { item?: unknown; error?: string } | null;
      if (!response.ok || !data?.item) {
        throw new Error(data?.error ?? "Failed to save suggestion.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save suggestion.");
    }
  };

  return (
    <main className="p-8 lg:p-12 space-y-8">
      <header>
        <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Ask</h1>
        <p className="text-custom-text-dark/60 text-base font-normal leading-normal">
          Ask for expressions and save what you like.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <textarea
          className="w-full rounded-lg bg-white border border-custom-border p-4 text-custom-text-dark placeholder:text-custom-text-dark/40 focus:ring-2 focus:ring-custom-primary focus:border-transparent outline-none transition-all"
          placeholder="How do I decline politely?"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="rounded-full bg-custom-primary px-6 py-3 text-sm font-bold text-white hover:bg-custom-primary/90 transition-colors disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Generating…" : "Ask"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

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
