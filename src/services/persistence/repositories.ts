import type {
  ConversationSession,
  EvaluationRecord,
  SessionEvaluationReport,
} from "../../domains/conversation";
import type { NotebookItem } from "../../domains/notes";
import type { ScenarioTemplate } from "../../domains/scenario";
import type { ReviewTask } from "../../domains/training";
import { InMemoryStorageAdapter, type StorageAdapter } from "./storage-adapter";

type EntityWithId = { id: string };

const COLLECTIONS = {
  scenarios: "scenarios",
  sessions: "sessions",
  evaluationRecords: "evaluationRecords",
  evaluationReports: "evaluationReports",
  notebookItems: "notebookItems",
  reviewTasks: "reviewTasks",
} as const;

const clone = <T>(value: T): T => structuredClone(value);

class GenericRepository<T extends EntityWithId> {
  constructor(protected readonly adapter: StorageAdapter, private readonly collection: string) {}

  async list(): Promise<T[]> {
    const records = await this.adapter.readCollection<T>(this.collection);
    return clone(records);
  }

  async getById(id: string): Promise<T | null> {
    const records = await this.list();
    return records.find((item) => item.id === id) ?? null;
  }

  async upsert(entity: T): Promise<T> {
    const records = await this.list();
    const existingIndex = records.findIndex((item) => item.id === entity.id);
    if (existingIndex >= 0) {
      records[existingIndex] = entity;
    } else {
      records.push(entity);
    }
    await this.adapter.writeCollection(this.collection, records);
    return entity;
  }

  async delete(id: string): Promise<void> {
    const records = await this.list();
    const filtered = records.filter((item) => item.id !== id);
    await this.adapter.writeCollection(this.collection, filtered);
  }

  async replaceAll(entities: T[]): Promise<void> {
    await this.adapter.writeCollection(this.collection, entities);
  }
}

export class ScenarioRepository extends GenericRepository<ScenarioTemplate> {
  constructor(adapter: StorageAdapter) {
    super(adapter, COLLECTIONS.scenarios);
  }
}

export class ConversationSessionRepository extends GenericRepository<ConversationSession> {
  constructor(adapter: StorageAdapter) {
    super(adapter, COLLECTIONS.sessions);
  }
}

export class EvaluationRecordRepository extends GenericRepository<EvaluationRecord> {
  constructor(adapter: StorageAdapter) {
    super(adapter, COLLECTIONS.evaluationRecords);
  }
}

export class SessionEvaluationReportRepository extends GenericRepository<SessionEvaluationReport> {
  constructor(adapter: StorageAdapter) {
    super(adapter, COLLECTIONS.evaluationReports);
  }
}

export class NotebookRepository extends GenericRepository<NotebookItem> {
  constructor(adapter: StorageAdapter) {
    super(adapter, COLLECTIONS.notebookItems);
  }
}

export class ReviewTaskRepository extends GenericRepository<ReviewTask> {
  constructor(adapter: StorageAdapter) {
    super(adapter, COLLECTIONS.reviewTasks);
  }
}

export const createInMemoryRepositories = (adapter: StorageAdapter = new InMemoryStorageAdapter()) => ({
  scenarios: new ScenarioRepository(adapter),
  sessions: new ConversationSessionRepository(adapter),
  evaluationRecords: new EvaluationRecordRepository(adapter),
  evaluationReports: new SessionEvaluationReportRepository(adapter),
  notebook: new NotebookRepository(adapter),
  reviewTasks: new ReviewTaskRepository(adapter),
});
