import { createNotebookItem, type ExpressionSuggestion, type NotebookItem } from "./models";

export interface NotebookRepositoryPort {
  list(): Promise<NotebookItem[]>;
  upsert(item: NotebookItem): Promise<NotebookItem>;
  delete(id: string): Promise<void>;
}

export interface NotebookServiceDeps {
  repository: NotebookRepositoryPort;
}

export class NotebookService {
  constructor(private readonly deps: NotebookServiceDeps) {}

  async saveSuggestion(suggestion: ExpressionSuggestion): Promise<NotebookItem> {
    const existing = await this.findByPhrase(suggestion.text);
    if (existing) {
      return existing;
    }

    const item = createNotebookItem({
      phrase: suggestion.text,
      meaning: suggestion.meaning,
      usageNotes: suggestion.usageNotes,
      variants: suggestion.examples,
      exampleSentences: suggestion.examples,
      contextSentence: suggestion.examples[0] ?? "",
      ipa: "",
      spokenNotes: "",
      source: suggestion.origin === "askPage" ? "ask" : "stw",
      sourceDetails: suggestion.origin,
      tags: [],
      locale: "en",
    });
    await this.deps.repository.upsert(item);
    return item;
  }

  async list(): Promise<NotebookItem[]> {
    return this.deps.repository.list();
  }

  async upsert(item: NotebookItem): Promise<NotebookItem> {
    const normalized = {
      ...item,
      phrase: item.phrase.trim(),
      meaning: item.meaning.trim(),
      updatedAt: new Date().toISOString(),
    };
    await this.deps.repository.upsert(normalized);
    return normalized;
  }

  async delete(id: string): Promise<void> {
    await this.deps.repository.delete(id);
  }

  private async findByPhrase(phrase: string): Promise<NotebookItem | null> {
    const items = await this.deps.repository.list();
    return items.find((item) => item.phrase.toLowerCase() === phrase.toLowerCase()) ?? null;
  }
}
