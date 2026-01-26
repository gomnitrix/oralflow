import { NextResponse } from "next/server";
import { z } from "zod";
import { AIClient } from "@/services/ai/client";
import { runDistill } from "@/domains/copilot/distill-service";
import { SettingsService } from "@/services/ai/settings";

const requestSchema = z.object({
  text: z.string().min(1),
  cardId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    const client = new AIClient();
    const settings = SettingsService.getInstance();
    const insight = await runDistill(client, {
      bubbleId: parsed.cardId ?? `training_${Date.now()}`,
      transcript: parsed.text,
      difficultyLevel: settings.getSettings().config.copilot.distillLevel,
    });
    return NextResponse.json({ insight });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
