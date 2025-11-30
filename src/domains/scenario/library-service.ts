import type { ScenarioTemplate } from "./models";
import type { ScenarioRepository } from "../../services/persistence/repositories";

export interface ScenarioLibraryDeps {
  repository: ScenarioRepository;
}

export class ScenarioLibraryService {
  constructor(private readonly deps: ScenarioLibraryDeps) {}

  async list(params?: { query?: string }): Promise<ScenarioTemplate[]> {
    const all = await this.deps.repository.list();
    return all.filter((scenario) => {
      const matchesQuery = params?.query
        ? scenario.title.toLowerCase().includes(params.query.toLowerCase())
        : true;
      return matchesQuery;
    });
  }

  async upsert(template: ScenarioTemplate): Promise<ScenarioTemplate> {
    await this.deps.repository.upsert(template);
    return template;
  }

  async delete(id: string): Promise<void> {
    await this.deps.repository.delete(id);
  }
}
