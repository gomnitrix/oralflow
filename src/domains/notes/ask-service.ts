import { AIClient } from "../../services/ai/client";
import { generateExpressions } from "../../services/ai/content-model";
import { NotebookService } from "./notebook-service";
import type { ExpressionSuggestion } from "./models";

export interface AskServiceDeps {
  aiClient: AIClient;
  notebook: NotebookService;
}

export class AskService {
  constructor(private readonly deps: AskServiceDeps) {}

  async ask(prompt: string): Promise<ExpressionSuggestion[]> {
    const result = await generateExpressions(this.deps.aiClient, { prompt, origin: "askPage", capability: "ask_ai" });
    return result.expressions;
  }

  async saveSuggestion(suggestion: ExpressionSuggestion) {
    await this.deps.notebook.saveSuggestion(suggestion);
  }
}
