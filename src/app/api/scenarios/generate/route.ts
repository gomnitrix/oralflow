import { NextResponse } from "next/server";
import { scenarioGenerateSchema } from "../../../../lib/validation/scenario";
import { AIClient } from "../../../../services/ai/client";
import { createInMemoryRepositories } from "../../../../services/persistence/repositories";
import { ScenarioStudioService } from "../../../../domains/scenario/studio-service";

const repositories = createInMemoryRepositories();
const studio = new ScenarioStudioService({
  aiClient: new AIClient(),
  repository: repositories.scenarios,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = scenarioGenerateSchema.parse(body);
    const result = await studio.generate(parsed);
    return NextResponse.json({ scenario: result.scenario, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
