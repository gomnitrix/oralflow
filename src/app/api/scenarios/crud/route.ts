import { NextResponse } from "next/server";
import {
  scenarioCrudListSchema,
  scenarioDeleteSchema,
  scenarioTemplateSchema,
} from "../../../../lib/validation/scenario";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { ScenarioLibraryService } from "../../../../domains/scenario/library-service";

const repositories = createServerRepositories();
const library = new ScenarioLibraryService({ repository: repositories.scenarios });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = scenarioCrudListSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    mode: searchParams.get("mode") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const scenarios = await library.list(parsed.data);
  return NextResponse.json({ scenarios });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = scenarioTemplateSchema.parse(body);
    const saved = await library.upsert(parsed);
    return NextResponse.json({ scenario: saved });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = scenarioDeleteSchema.safeParse({ id: searchParams.get("id") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await library.delete(parsed.data.id);
  return new NextResponse(null, { status: 204 });
}
