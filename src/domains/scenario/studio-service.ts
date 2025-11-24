import { AIClient } from "../../services/ai/client";
import { generateScenario, type ScenarioGenerationResult } from "../../services/ai/content-model";
import type { ScenarioGenerateRequest } from "../../lib/validation/scenario";
import type { ScenarioTemplate } from "./models";
import { ScenarioRepository } from "../../services/persistence/repositories";

export interface ScenarioStudioDeps {
  aiClient: AIClient;
  repository: ScenarioRepository;
}

export class ScenarioStudioService {
  constructor(private readonly deps: ScenarioStudioDeps) {}

  async generate(input: ScenarioGenerateRequest): Promise<ScenarioGenerationResult> {
    const result = await generateScenario(this.deps.aiClient, input);
    await this.deps.repository.upsert(result.scenario);
    return result;
  }

  async normalizeDraft(draft: ScenarioTemplate): Promise<ScenarioTemplate> {
    const normalized: ScenarioTemplate = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      updatedAt: new Date().toISOString(),
    };
    await this.deps.repository.upsert(normalized);
    return normalized;
  }
}
