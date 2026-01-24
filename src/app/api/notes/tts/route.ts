import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeech } from "@/services/ai/tts";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    const result = await synthesizeSpeech(parsed.text, "notebook_tts");
    return NextResponse.json({ audioUrl: result.audioUrl, model: result.model, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
