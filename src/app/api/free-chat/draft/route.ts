import { NextResponse } from "next/server";
import { freeChatDraftSchema } from "@/lib/validation/free-chat";
import { AIClient } from "@/services/ai/client";

export const runtime = "nodejs";

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
      "- title: a concise English title (<= 60 characters).",
      `- summary: if context length is long (context_length=${contextLength} chars), produce a concise summary (<= 80 words); otherwise reuse englishContext as summary.`,
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

    const response = {
      title: typeof parsedJson.title === "string" ? parsedJson.title.trim() : parsed.title?.trim() || "Free Chat",
      englishContext:
        typeof parsedJson.englishContext === "string"
          ? parsedJson.englishContext.trim()
          : parsed.context.trim(),
      summary:
        typeof parsedJson.summary === "string"
          ? parsedJson.summary.trim()
          : parsed.context.trim(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[free-chat:draft] failed", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
