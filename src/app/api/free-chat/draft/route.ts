import { NextResponse } from "next/server";
import { freeChatDraftSchema } from "@/lib/validation/free-chat";
import { AIClient } from "@/services/ai/client";

export const runtime = "nodejs";

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
const limitWords = (text: string, limit: number): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return words.join(" ");
  return words.slice(0, limit).join(" ");
};
const fallbackTitleFromContext = (context: string): string => limitWords(context, 8);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = freeChatDraftSchema.parse(body);
    const ai = new AIClient();

    const contextLength = parsed.context.length;
    const prompt = [
      "You prepare a free-form chat context for an English-speaking AI partner.",
      "Return ONLY strict JSON with keys: title, englishContext, summary.",
      "- englishContext: the English version of the provided context (translate if source is not English; otherwise keep as-is, lightly clean).",
      "- title: a concise English title (<= 60 characters). For long inputs, you may reuse the short summary as title.",
      `- summary rules:`,
      `  * If the input is short, reuse the englishContext as summary (do NOT expand it).`,
      `  * If the input is long (context_length=${contextLength} chars), produce a very short summary (<= 8 words).`,
      "No explanations, no prose—just valid JSON.",
    ].join("\n");

    const { message } = await ai.completeChat(
      {
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: JSON.stringify({
              context: parsed.context,
              title_hint: parsed.title ?? null,
              user_role: parsed.userRole ?? null,
              ai_role: parsed.aiRole ?? null,
            }),
          },
        ],
        temperature: 0.3,
      },
      "free_chat_draft"
    );

    const match = message.match(/\{[\s\S]*\}/);
    const jsonText = match ? match[0] : message;
    const parsedJson = JSON.parse(jsonText);

    const englishContext =
      typeof parsedJson.englishContext === "string"
        ? parsedJson.englishContext.trim()
        : parsed.context.trim();

    const isShort = countWords(englishContext) <= 12;

    const resolvedSummary = (() => {
      if (isShort) return englishContext;
      const raw = typeof parsedJson.summary === "string" ? parsedJson.summary.trim() : "";
      const limited = raw ? limitWords(raw, 8) : "";
      return limited || limitWords(englishContext, 8);
    })();

    const resolvedTitle = (() => {
      if (isShort) {
        return parsed.title?.trim() || (typeof parsedJson.title === "string" ? parsedJson.title.trim() : "") || fallbackTitleFromContext(englishContext);
      }
      return resolvedSummary || fallbackTitleFromContext(englishContext);
    })();

    const response = {
      title: resolvedTitle || "Free Chat",
      englishContext,
      summary: resolvedSummary || englishContext,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[free-chat:draft] failed", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
