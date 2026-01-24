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
const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const fallbackTitleFromContext = (context: string): string => limitWords(context, 8);

const extractJson = (message: string) => {
  const match = message.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI response was not valid JSON.");
  }
  return JSON.parse(match[0]);
};

const ensureSummaryLimit = async (summary: string, englishContext: string, ai: AIClient): Promise<string> => {
  if (countWords(summary) <= 8) return summary;

  const { message } = await ai.completeChat(
    {
      messages: [
        {
          role: "system",
          content: [
            "Rewrite the summary in 8 words or fewer.",
            "Keep the full meaning, avoid truncation, no extra commentary.",
            "Return ONLY the rewritten summary text.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({ summary, englishContext }),
        },
      ],
      temperature: 0.2,
    },
    "free_chat_draft"
  );

  const cleaned = message.replace(/^[\"']|[\"']$/g, "").trim();
  if (!cleaned) {
    throw new Error("Failed to refine summary.");
  }
  if (countWords(cleaned) > 8) {
    throw new Error("Summary exceeds 8 words after refinement.");
  }
  return cleaned;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = freeChatDraftSchema.parse(body);
    const ai = new AIClient();

    const prompt = [
      "You prepare a free chat context for an English-speaking conversation.",
      "Return ONLY strict JSON with keys: title, englishContext, summary.",
      "- englishContext: rewrite the input into clean, natural English for conversation.",
      "  Translate if needed. Remove filler, redundancy, and off-topic fragments.",
      "- summary: 8 words or fewer, complete meaning, not a truncation.",
      "- title: concise English title (<= 60 characters).",
      "No markdown, no extra keys, only valid JSON.",
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
            }),
          },
        ],
        temperature: 0.3,
      },
      "free_chat_draft"
    );

    const parsedJson = extractJson(message);
    const englishContext = normalizeText(parsedJson.englishContext);
    if (!englishContext) {
      throw new Error("AI response missing englishContext.");
    }

    const summaryRaw = normalizeText(parsedJson.summary);
    if (!summaryRaw) {
      throw new Error("AI response missing summary.");
    }

    const refinedSummary = await ensureSummaryLimit(summaryRaw, englishContext, ai);
    const resolvedTitle =
      normalizeText(parsed.title) ||
      normalizeText(parsedJson.title) ||
      fallbackTitleFromContext(englishContext);

    const response = {
      title: resolvedTitle || "Free Chat",
      englishContext,
      summary: refinedSummary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[free-chat:draft] failed", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
