import type { ConversationSession, EvaluationRecord, SessionEvaluationReport } from "../../domains/conversation";
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
  constructor(protected readonly adapter: StorageAdapter, private readonly collection: string) { }

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

const parseStringArray = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch {
    return [];
  }
  return [];
};

const stringifyArray = (value?: string[]): string => JSON.stringify(value ?? []);

const isBrowser = typeof window !== "undefined";
let sharedDb: any | null = null;

const resolveSqlite = (): any | null => {
  if (isBrowser) return null;
  if (sharedDb) return sharedDb;
  try {
    // Defer requires to server runtime to avoid bundling in the client
    const path = require("path") as typeof import("path");
    const fs = require("fs") as typeof import("fs");
    // Lazy require to avoid bundling into client
    const Database = require("better-sqlite3");
    const storageRoot = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "local_storage");
    fs.mkdirSync(storageRoot, { recursive: true });
    const dbPath = path.join(storageRoot, "oralflow.db");
    sharedDb = new Database(dbPath);
    sharedDb.exec(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        emoji TEXT NOT NULL,
        description TEXT NOT NULL,
        learnerRole TEXT NOT NULL,
        aiRole TEXT NOT NULL,
        mainGoal TEXT NOT NULL,
        subGoals TEXT NOT NULL,
        sourceType TEXT NOT NULL,
        sourceText TEXT,
        lastPracticedAt TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios (createdAt);
      CREATE TABLE IF NOT EXISTS notebook_items (
        id TEXT PRIMARY KEY,
        phrase TEXT NOT NULL,
        meaning TEXT NOT NULL,
        usageNotes TEXT NOT NULL,
        variants TEXT NOT NULL,
        exampleSentences TEXT NOT NULL,
        contextSentence TEXT NOT NULL,
        ipa TEXT NOT NULL,
        spokenNotes TEXT NOT NULL,
        source TEXT NOT NULL,
        sourceDetails TEXT NOT NULL,
        tags TEXT,
        locale TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notebook_created_at ON notebook_items (createdAt);
    `);
    return sharedDb;
  } catch (err) {
    console.warn("[sqlite] failed to initialize, falling back to file/in-memory", err);
    return null;
  }
};

export class ScenarioRepository {
  private readonly fileRepo?: GenericRepository<ScenarioTemplate>;
  private readonly db: any | null;

  constructor(private readonly adapter?: StorageAdapter) {
    if (adapter) {
      this.fileRepo = new GenericRepository<ScenarioTemplate>(adapter, COLLECTIONS.scenarios);
      this.db = null;
      return;
    }
    this.db = resolveSqlite();
    if (!this.db) {
      const { JsonFileStorageAdapter } = require("./json-file-adapter") as typeof import("./json-file-adapter");
      const fileAdapter = new JsonFileStorageAdapter(process.env.LOCAL_STORAGE_PATH || "");
      this.fileRepo = new GenericRepository<ScenarioTemplate>(fileAdapter, COLLECTIONS.scenarios);
    }
  }

  private mapRow(row: any): ScenarioTemplate {
    return {
      id: row.id,
      title: row.title,
      emoji: row.emoji,
      description: row.description,
      learnerRole: row.learnerRole,
      aiRole: row.aiRole,
      mainGoal: row.mainGoal,
      subGoals: parseStringArray(row.subGoals),
      sourceType: row.sourceType,
      sourceText: row.sourceText ?? null,
      lastPracticedAt: row.lastPracticedAt ?? null,
      tags: parseStringArray(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async list(): Promise<ScenarioTemplate[]> {
    if (this.fileRepo) {
      return this.fileRepo.list();
    }
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM scenarios ORDER BY createdAt DESC");
    const rows = stmt.all();
    return rows.map((r: any) => this.mapRow(r));
  }

  async getById(id: string): Promise<ScenarioTemplate | null> {
    if (this.fileRepo) {
      return this.fileRepo.getById(id);
    }
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM scenarios WHERE id = ?");
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  async upsert(entity: ScenarioTemplate): Promise<ScenarioTemplate> {
    if (this.fileRepo) {
      await this.fileRepo.upsert(entity);
      return entity;
    }
    if (!this.db) return entity;
    this.db
      .prepare(
        `INSERT INTO scenarios (id, title, emoji, description, learnerRole, aiRole, mainGoal, subGoals, sourceType, sourceText, lastPracticedAt, tags, createdAt, updatedAt)
         VALUES (@id, @title, @emoji, @description, @learnerRole, @aiRole, @mainGoal, @subGoals, @sourceType, @sourceText, @lastPracticedAt, @tags, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title,
           emoji=excluded.emoji,
           description=excluded.description,
           learnerRole=excluded.learnerRole,
           aiRole=excluded.aiRole,
           mainGoal=excluded.mainGoal,
           subGoals=excluded.subGoals,
           sourceType=excluded.sourceType,
           sourceText=excluded.sourceText,
           lastPracticedAt=excluded.lastPracticedAt,
           tags=excluded.tags,
           updatedAt=excluded.updatedAt`
      )
      .run({
        ...entity,
        subGoals: stringifyArray(entity.subGoals),
        tags: stringifyArray(entity.tags),
      });
    return entity;
  }

  async delete(id: string): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.delete(id);
      return;
    }
    if (!this.db) return;
    this.db.prepare("DELETE FROM scenarios WHERE id = ?").run(id);
  }

  async replaceAll(entities: ScenarioTemplate[]): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.replaceAll(entities);
      return;
    }
    if (!this.db) return;
    const insert = this.db.prepare(
      `INSERT INTO scenarios (id, title, emoji, description, learnerRole, aiRole, mainGoal, subGoals, sourceType, sourceText, lastPracticedAt, tags, createdAt, updatedAt)
       VALUES (@id, @title, @emoji, @description, @learnerRole, @aiRole, @mainGoal, @subGoals, @sourceType, @sourceText, @lastPracticedAt, @tags, @createdAt, @updatedAt)`
    );
    const trx = this.db.transaction((rows: ScenarioTemplate[]) => {
      this.db.prepare("DELETE FROM scenarios").run();
      for (const row of rows) {
        insert.run({
          ...row,
          subGoals: stringifyArray(row.subGoals),
          tags: stringifyArray(row.tags),
        });
      }
    });
    trx(entities);
  }
}

export class NotebookRepository {
  private readonly fileRepo?: GenericRepository<NotebookItem>;
  private readonly db: any | null;

  constructor(private readonly adapter?: StorageAdapter) {
    if (adapter) {
      this.fileRepo = new GenericRepository<NotebookItem>(adapter, COLLECTIONS.notebookItems);
      this.db = null;
      return;
    }
    this.db = resolveSqlite();
    if (!this.db) {
      const { JsonFileStorageAdapter } = require("./json-file-adapter") as typeof import("./json-file-adapter");
      const fileAdapter = new JsonFileStorageAdapter(process.env.LOCAL_STORAGE_PATH || "");
      this.fileRepo = new GenericRepository<NotebookItem>(fileAdapter, COLLECTIONS.notebookItems);
    }
  }

  private mapRow(row: any): NotebookItem {
    return {
      id: row.id,
      phrase: row.phrase,
      meaning: row.meaning,
      usageNotes: row.usageNotes,
      variants: parseStringArray(row.variants),
      exampleSentences: parseStringArray(row.exampleSentences),
      contextSentence: row.contextSentence,
      ipa: row.ipa,
      spokenNotes: row.spokenNotes,
      source: row.source,
      sourceDetails: row.sourceDetails,
      tags: parseStringArray(row.tags),
      locale: row.locale ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async list(): Promise<NotebookItem[]> {
    if (this.fileRepo) {
      return this.fileRepo.list();
    }
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM notebook_items ORDER BY createdAt DESC");
    const rows = stmt.all();
    return rows.map((r: any) => this.mapRow(r));
  }

  async getById(id: string): Promise<NotebookItem | null> {
    if (this.fileRepo) {
      return this.fileRepo.getById(id);
    }
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM notebook_items WHERE id = ?");
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  async upsert(entity: NotebookItem): Promise<NotebookItem> {
    if (this.fileRepo) {
      await this.fileRepo.upsert(entity);
      return entity;
    }
    if (!this.db) return entity;
    this.db
      .prepare(
        `INSERT INTO notebook_items (id, phrase, meaning, usageNotes, variants, exampleSentences, contextSentence, ipa, spokenNotes, source, sourceDetails, tags, locale, createdAt, updatedAt)
         VALUES (@id, @phrase, @meaning, @usageNotes, @variants, @exampleSentences, @contextSentence, @ipa, @spokenNotes, @source, @sourceDetails, @tags, @locale, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           phrase=excluded.phrase,
           meaning=excluded.meaning,
           usageNotes=excluded.usageNotes,
           variants=excluded.variants,
           exampleSentences=excluded.exampleSentences,
           contextSentence=excluded.contextSentence,
           ipa=excluded.ipa,
           spokenNotes=excluded.spokenNotes,
           source=excluded.source,
           sourceDetails=excluded.sourceDetails,
           tags=excluded.tags,
           locale=excluded.locale,
           updatedAt=excluded.updatedAt`
      )
      .run({
        ...entity,
        variants: stringifyArray(entity.variants),
        exampleSentences: stringifyArray(entity.exampleSentences),
        tags: stringifyArray(entity.tags),
      });
    return entity;
  }

  async delete(id: string): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.delete(id);
      return;
    }
    if (!this.db) return;
    this.db.prepare("DELETE FROM notebook_items WHERE id = ?").run(id);
  }

  async replaceAll(entities: NotebookItem[]): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.replaceAll(entities);
      return;
    }
    if (!this.db) return;
    const insert = this.db.prepare(
      `INSERT INTO notebook_items (id, phrase, meaning, usageNotes, variants, exampleSentences, contextSentence, ipa, spokenNotes, source, sourceDetails, tags, locale, createdAt, updatedAt)
       VALUES (@id, @phrase, @meaning, @usageNotes, @variants, @exampleSentences, @contextSentence, @ipa, @spokenNotes, @source, @sourceDetails, @tags, @locale, @createdAt, @updatedAt)`
    );
    const trx = this.db.transaction((rows: NotebookItem[]) => {
      this.db.prepare("DELETE FROM notebook_items").run();
      for (const row of rows) {
        insert.run({
          ...row,
          variants: stringifyArray(row.variants),
          exampleSentences: stringifyArray(row.exampleSentences),
          tags: stringifyArray(row.tags),
        });
      }
    });
    trx(entities);
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
