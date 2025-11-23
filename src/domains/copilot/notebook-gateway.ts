import type { ExpressionSuggestion } from "../notes/models";
import { NotebookService } from "../notes/notebook-service";

export class NotebookGateway {
  constructor(private readonly notebook: NotebookService) {}

  async saveSuggestion(suggestion: ExpressionSuggestion): Promise<void> {
    await this.notebook.saveSuggestion(suggestion);
  }
}
