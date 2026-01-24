'use client';

import React, { useEffect, useRef, useState } from "react";
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
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setSaveNotice(null);
      const response = await fetch("/api/ask/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suggestion),
      });
      const data = (await response.json().catch(() => null)) as { item?: unknown; error?: string } | null;
      if (!response.ok || !data?.item) {
        throw new Error(data?.error ?? "Failed to save suggestion.");
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      setSaveNotice("Saved to Notebook.");
      saveTimerRef.current = setTimeout(() => setSaveNotice(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save suggestion.");
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-custom-bg">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-custom-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-custom-accent/30 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-10 px-6 py-16 text-center">
          <header className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-custom-primary">Ask</p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-custom-text-dark sm:text-5xl">
              Find the natural phrase
            </h1>
            <p className="text-custom-text-dark/60">
              Type what you want to say and get native-friendly options.
            </p>
          </header>

          <form onSubmit={submit} className="w-full space-y-4">
            <div className="flex items-center gap-3 rounded-full border border-custom-border bg-white px-5 py-3 shadow-lg shadow-custom-primary/10">
              <span className="material-symbols-outlined text-custom-text-dark/40">search</span>
              <textarea
                className="flex-1 resize-none bg-transparent border-0 text-base text-custom-text-dark placeholder:text-custom-text-dark/40 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none leading-tight py-0 self-center"
                placeholder="How do I decline politely?"
                rows={1}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSubmitting}
                aria-label="Ask prompt"
              />
              <button
                type="submit"
                className="rounded-full bg-custom-primary px-6 py-2 text-sm font-bold text-white shadow-sm shadow-custom-primary/20 hover:bg-custom-primary/90 transition-colors disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Generating..." : "Ask"}
              </button>
            </div>
            <p className="text-xs text-custom-text-dark/50">
              Try: &quot;Make this sound more polite&quot; or &quot;A casual way to agree&quot;.
            </p>
          </form>

          <div className="w-full text-left">
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {saveNotice ? <p className="text-sm text-green-600">{saveNotice}</p> : null}

            {suggestions.length === 0 ? (
              <div className="rounded-2xl border border-custom-border bg-white/70 p-6 text-sm text-custom-text-dark/60 shadow-sm">
                Suggestions will appear here after you ask.
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <ExpressionPreview key={suggestion.id} suggestion={suggestion} onSave={save} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
