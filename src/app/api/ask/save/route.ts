import { NextResponse } from "next/server";
import { expressionSuggestionSchema } from "../../../../lib/validation/notes";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { NotebookService } from "../../../../domains/notes/notebook-service";

const repositories = createServerRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const suggestion = expressionSuggestionSchema.parse(body);
    const item = await notebookService.saveSuggestion(suggestion);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
