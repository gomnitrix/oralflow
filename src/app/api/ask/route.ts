import { NextResponse } from "next/server";
import { createInMemoryRepositories } from "../../../services/persistence/repositories";
import { NotebookService } from "../../../domains/notes/notebook-service";
import { AskService } from "../../../domains/notes/ask-service";
import { AIClient } from "../../../services/ai/client";

const repositories = createInMemoryRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });
const askService = new AskService({ aiClient: new AIClient(), notebook: notebookService });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt as string | undefined;
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    const suggestions = await askService.ask(prompt);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
