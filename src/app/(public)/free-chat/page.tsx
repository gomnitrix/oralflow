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
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  // Clear draft when inputs change
  useEffect(() => {
    setDraft(null);
  }, [title, context, userRole, aiRole]);

  const contextPreview = useMemo(() => {
    if (draft?.englishContext?.trim()) return draft.englishContext.trim();
    if (!context.trim()) return "Enter a context on the left, then prepare with AI to see the structured result.";
    return context.trim();
  }, [context, draft]);

  const summaryPreview = useMemo(() => {
    if (draft?.summary?.trim()) return draft.summary.trim();
    if (!context.trim()) return "Summary will appear here after preparing with AI.";
    return "Click “Prepare with AI” to generate a concise summary.";
  }, [context, draft]);

  const effectiveTitle = draft?.title ?? buildTitle(title, context);

  const ensureDraft = async (): Promise<DraftResult | null> => {
    const cleanContext = trimText(context);
    if (!cleanContext) {
      setError("Please enter a context before starting.");
      return null;
    }
    setError(null);

    if (draft) return draft;

    try {
      setIsPreparing(true);
      const response = await fetch("/api/free-chat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: cleanContext,
          title: title || undefined,
          userRole,
          aiRole,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        throw new Error(data?.error || "Failed to prepare context.");
      }
      const next: DraftResult = {
        title: data.title || buildTitle(title, cleanContext),
        englishContext: data.englishContext || cleanContext,
        summary: data.summary || data.englishContext || cleanContext,
      };
      setDraft(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare context.");
      return null;
    } finally {
      setIsPreparing(false);
    }
  };

  const startConversation = async (mode: "stw" | "zen") => {
    const prepared = await ensureDraft();
    if (!prepared) return;

    const params = new URLSearchParams({
      context: prepared.englishContext,
      title: prepared.title,
      summary: prepared.summary,
      userRole: trimText(userRole) || defaultUserRole,
      aiRole: trimText(aiRole) || defaultAiRole,
      origin: "freechat",
    });

    router.push(`/${mode}?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-custom-bg p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-bold text-custom-primary uppercase tracking-[0.12em]">Free Chat</p>
          <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Context Chat</h1>
          <p className="text-custom-text-dark/70 max-w-2xl">
            Paste any text as context, let AI translate/clean it, and jump into a conversation with Zen or Stop The World. Nothing is saved as a scenario.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-custom-text-dark">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this chat a name"
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-custom-text-dark">Context</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Paste any article, email, notes, or text you want to chat about..."
                  rows={10}
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                />
                <p className="text-xs text-custom-text-dark/60">
                  We’ll translate to English if needed and summarize longer passages to keep the chat concise.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-custom-text-dark">Your role</label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder={defaultUserRole}
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-custom-text-dark">AI role</label>
                <input
                  type="text"
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  placeholder={defaultAiRole}
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                />
              </div>
            </div>

              <button
                onClick={ensureDraft}
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
          <div className="lg:col-span-7 xl:col-span-8 h-full min-h-[560px]">
            <div className="flex flex-col gap-6 h-full">
              <div className="flex-1 bg-white rounded-[32px] p-8 shadow-sm border border-custom-border flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-custom-primary uppercase tracking-[0.2em]">Context Preview</p>
                    <h2 className="text-2xl font-bold text-custom-text-dark leading-tight">
                      {effectiveTitle}
                    </h2>
                    <p className="text-sm text-custom-text-dark/60">
                      {trimText(userRole) || defaultUserRole} · {trimText(aiRole) || defaultAiRole}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-custom-text-dark/20">auto_awesome</span>
                </div>

                <div className="grid gap-4">
                  <div className="bg-custom-bg p-4 rounded-2xl border border-custom-border/60 max-h-[200px] overflow-auto whitespace-pre-wrap text-sm text-custom-text-dark/80 leading-relaxed">
                    {contextPreview}
                  </div>
                  <div className="bg-custom-primary/5 p-4 rounded-2xl border border-custom-primary/10 whitespace-pre-wrap text-sm text-custom-text-dark/80 leading-relaxed">
                    <p className="text-xs font-bold text-custom-primary uppercase tracking-[0.16em] mb-1">Summary</p>
                    {summaryPreview}
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
                  disabled={isPreparing}
                >
                  Start in Stop The World
                </button>
                <button
                  onClick={() => startConversation("zen")}
                  className="w-full rounded-full bg-white py-4 text-custom-text-dark font-bold text-lg hover:bg-custom-bg transition-colors border border-custom-border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isPreparing}
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
