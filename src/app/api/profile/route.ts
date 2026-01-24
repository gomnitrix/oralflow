import { NextResponse } from "next/server";
import { z } from "zod";
import { loadProfile, saveProfile } from "@/services/profile/profile-store";

export const runtime = "nodejs";

const profileSchema = z.object({
  username: z.string().min(1).max(60),
  avatarUrl: z.string().optional().default(""),
});

export async function GET() {
  const profile = loadProfile();
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = profileSchema.parse(body);
    const saved = saveProfile(parsed);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
