import { NextResponse } from "next/server";
import { createServerRepositories } from "../../../../../services/persistence/server-repositories";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const repositories = createServerRepositories();
    await repositories.reviewCards.deleteAll();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
