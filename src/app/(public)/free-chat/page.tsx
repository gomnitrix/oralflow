'use client';

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const defaultUserRole = "You";
const defaultAiRole = "A friendly conversation partner";

const trimText = (value: string) => value.trim();

const buildTitle = (title: string, context: string) => {
  if (title.trim()) return title.trim();
  const snippet = context.trim().split(/\s+/).slice(0, 12).join(" ");
  return snippet ? `Free Chat: ${snippet}` : "Free Chat";
};

export default function FreeChatPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contextPreview = useMemo(() => {
    if (!context.trim()) return "Enter your context on the left to see a preview.";
    return context.trim();
  }, [context]);

  const startConversation = (mode: "stw" | "zen") => {
    const cleanContext = trimText(context);
    if (!cleanContext) {
      setError("请输入一段文本作为上下文。");
      return;
    }

    setError(null);
    const params = new URLSearchParams({
      context: cleanContext,
      title: buildTitle(title, cleanContext),
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
            粘贴或输入任意文本作为上下文，直接与 AI 进行自由对话，无需创建或保存场景。随时选择 Zen 或 Stop The World 模式开始。
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-custom-text-dark">对话标题（可选）</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给这段对话起个名字，便于识别"
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-custom-text-dark">上下文文本</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="粘贴文章片段、邮件、会议纪要、备忘，或任意你想聊的内容..."
                  rows={10}
                  className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                />
                <p className="text-xs text-custom-text-dark/60">
                  文本仅用于本次对话，不会保存为场景。内容较长时会自动作为对话背景发送给 AI。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-custom-text-dark">你的身份（可选）</label>
                  <input
                    type="text"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    placeholder="例如：文本作者 / 读者 / 汇报人"
                    className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-custom-text-dark">AI 的身份（可选）</label>
                  <input
                    type="text"
                    value={aiRole}
                    onChange={(e) => setAiRole(e.target.value)}
                    placeholder="例如：讨论伙伴 / 校对助手 / 头脑风暴伙伴"
                    className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                  />
                </div>
              </div>
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
                      {buildTitle(title, context)}
                    </h2>
                    <p className="text-sm text-custom-text-dark/60">
                      {trimText(userRole) || defaultUserRole} · {trimText(aiRole) || defaultAiRole}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-custom-text-dark/20">auto_awesome</span>
                </div>

                <div className="bg-custom-bg p-4 rounded-2xl border border-custom-border/60 max-h-[320px] overflow-auto whitespace-pre-wrap text-sm text-custom-text-dark/80 leading-relaxed">
                  {contextPreview}
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
                  className="w-full rounded-full bg-custom-primary py-4 text-white font-bold text-lg hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20"
                >
                  使用 Stop The World 开始
                </button>
                <button
                  onClick={() => startConversation("zen")}
                  className="w-full rounded-full bg-white py-4 text-custom-text-dark font-bold text-lg hover:bg-custom-bg transition-colors border border-custom-border shadow-sm"
                >
                  使用 Zen 模式开始
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
