'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const defaultUserRole = "You";
const defaultAiRole = "A friendly conversation partner";

const trimText = (value: string) => value.trim();

const buildTitle = (title: string, context: string) => {
  if (title.trim()) return title.trim();
  const snippet = context.trim().split(/\s+/).slice(0, 12).join(" ");
  return snippet ? `Free Chat: ${snippet}` : "Free Chat";
};

type DraftResult = {
  title: string;
  englishContext: string;
  summary: string;
};

export default function FreeChatPage() {
  const router = useRouter();
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  // Clear draft when context changes
  useEffect(() => {
    setDraft(null);
    setIsEditingPreview(false);
  }, [context]);

  const contextPreview = useMemo(() => {
    if (draft?.englishContext?.trim()) return draft.englishContext.trim();
    if (!context.trim()) return "Enter a context on the left, then prepare with AI to see the structured result.";
    return context.trim();
  }, [context, draft]);

  const summaryPreview = useMemo(() => {
    if (draft?.summary?.trim()) return draft.summary.trim();
    if (!context.trim()) return "Summary will appear here after preparing with AI.";
    return "Click Prepare with AI to generate a concise summary.";
  }, [context, draft]);

  const effectiveTitle = draft?.title ?? buildTitle("", context);

  const prepareDraft = async (): Promise<DraftResult | null> => {
    const cleanContext = trimText(context);
    if (!cleanContext) {
      setError("Please enter a context before preparing.");
      return null;
    }
    setError(null);

    try {
      setIsPreparing(true);
      const response = await fetch("/api/free-chat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: cleanContext,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        throw new Error(data?.error || "Failed to prepare context.");
      }
      if (!data.englishContext || !data.summary) {
        throw new Error("Draft response is missing required fields.");
      }
      const next: DraftResult = {
        title: data.title || buildTitle("", cleanContext),
        englishContext: data.englishContext,
        summary: data.summary,
      };
      setDraft(next);
      setIsEditingPreview(false);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare context.");
      return null;
    } finally {
      setIsPreparing(false);
    }
  };

  const startConversation = (mode: "stw" | "zen") => {
    if (!draft) {
      setError("Prepare with AI before starting.");
      return;
    }

    const params = new URLSearchParams({
      context: draft.englishContext,
      title: draft.title,
      summary: draft.summary,
      userRole: defaultUserRole,
      aiRole: defaultAiRole,
      origin: "freechat",
    });

    router.push(`/${mode}?${params.toString()}`);
  };

  const togglePreviewEdit = () => {
    if (!draft) return;
    setIsEditingPreview((prev) => !prev);
  };

  const updateDraftField = (field: keyof DraftResult, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <main className="min-h-screen bg-custom-bg p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Free Chat</h1>
          <p className="text-custom-text-dark/70 max-w-2xl">
            Turn any text into a clean English chat starter in seconds.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Input */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-custom-text-dark">Context</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Paste any article, email, notes, or text you want to chat about..."
                  rows={12}
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                />
                <p className="text-xs text-custom-text-dark/60">
                  We will translate, clean, and condense it into conversational English.
                </p>
              </div>

              <button
                onClick={prepareDraft}
                disabled={isPreparing}
                className="w-full rounded-full bg-custom-primary py-3 text-white font-bold text-base hover:bg-custom-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPreparing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                    Preparing with AI...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    Prepare with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Actions */}
          <div className="lg:col-span-6 xl:col-span-6 h-full min-h-[560px]">
            <div className="flex flex-col gap-6 h-full">
              <div className="flex-1 bg-white rounded-[32px] p-8 shadow-sm border border-custom-border flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-custom-primary uppercase tracking-[0.2em]">Context Preview</p>
                    {isEditingPreview ? (
                      <input
                        type="text"
                        value={draft?.title ?? ""}
                        onChange={(event) => updateDraftField("title", event.target.value)}
                        placeholder={effectiveTitle}
                        className="w-full rounded-xl border border-custom-border bg-white px-3 py-2 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all text-2xl font-bold leading-tight"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-custom-text-dark leading-tight">
                        {effectiveTitle}
                      </h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePreviewEdit}
                      disabled={!draft}
                      className="w-10 h-10 rounded-full bg-custom-bg flex items-center justify-center text-custom-text-dark/60 hover:text-custom-primary hover:bg-custom-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={isEditingPreview ? "Finish editing" : "Edit preview"}
                    >
                      <span className="material-symbols-outlined text-xl">{isEditingPreview ? "check" : "edit"}</span>
                    </button>
                    <span className="material-symbols-outlined text-3xl text-custom-text-dark/20">auto_awesome</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  {isEditingPreview ? (
                    <textarea
                      value={draft?.englishContext ?? ""}
                      onChange={(event) => updateDraftField("englishContext", event.target.value)}
                      placeholder={contextPreview}
                      rows={8}
                      className="bg-custom-bg p-4 rounded-2xl border border-custom-border/60 w-full text-sm text-custom-text-dark/80 leading-relaxed focus:outline-none focus:ring-1 focus:ring-custom-primary"
                    />
                  ) : (
                    <div className="bg-custom-bg p-4 rounded-2xl border border-custom-border/60 max-h-[220px] overflow-auto whitespace-pre-wrap text-sm text-custom-text-dark/80 leading-relaxed">
                      {contextPreview}
                    </div>
                  )}
                  <div className="bg-custom-primary/5 p-4 rounded-2xl border border-custom-primary/10 whitespace-pre-wrap text-sm text-custom-text-dark/80 leading-relaxed">
                    <p className="text-xs font-bold text-custom-primary uppercase tracking-[0.16em] mb-1">Summary</p>
                    {isEditingPreview ? (
                      <input
                        type="text"
                        value={draft?.summary ?? ""}
                        onChange={(event) => updateDraftField("summary", event.target.value)}
                        placeholder={summaryPreview}
                        className="w-full bg-transparent text-sm text-custom-text-dark/80 focus:outline-none"
                      />
                    ) : (
                      summaryPreview
                    )}
                  </div>
                </div>

                {error ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => startConversation("stw")}
                  className="w-full rounded-full bg-custom-primary py-4 text-white font-bold text-lg hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!draft || isPreparing}
                >
                  Start in Stop The World
                </button>
                <button
                  onClick={() => startConversation("zen")}
                  className="w-full rounded-full bg-white py-4 text-custom-text-dark font-bold text-lg hover:bg-custom-bg transition-colors border border-custom-border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!draft || isPreparing}
                >
                  Start in Zen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
