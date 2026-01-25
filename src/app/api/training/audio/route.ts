import { NextResponse } from "next/server";
import { trainingAudioSchema } from "@/lib/validation/training";
import { synthesizeSpeech } from "@/services/ai/tts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") ?? "";
    const parsed = trainingAudioSchema.parse({ text });
    const result = await synthesizeSpeech(parsed.text, "notebook_tts");
    return NextResponse.json({ audioUrl: result.audioUrl, model: result.model, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingAudioSchema.parse(body);
    const result = await synthesizeSpeech(parsed.text, "notebook_tts");
    return NextResponse.json({ audioUrl: result.audioUrl, model: result.model, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
