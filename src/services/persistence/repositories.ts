import path from "path";

import type { ConversationSession, EvaluationRecord, SessionEvaluationReport } from "../../domains/conversation";
import type { NotebookItem } from "../../domains/notes";
import type { ScenarioTemplate } from "../../domains/scenario";
import type { ReviewCard, ReviewTask } from "../../domains/training";
import { InMemoryStorageAdapter, type StorageAdapter } from "./storage-adapter";
import { resolveStorageRoot } from "./storage-root";

type EntityWithId = { id: string };

const COLLECTIONS = {
  scenarios: "scenarios",
  sessions: "sessions",
  evaluationRecords: "evaluationRecords",
  evaluationReports: "evaluationReports",
  notebookItems: "notebookItems",
  reviewTasks: "reviewTasks",
  reviewCards: "reviewCards",
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

const ensureSchema = (db: any) => {
  db.exec(`
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
        updatedAt TEXT NOT NULL,
        srsLevel INTEGER DEFAULT 0,
        nextReviewAt TEXT,
        lastReviewedAt TEXT,
        lastDifficulty TEXT,
        easeFactor REAL DEFAULT 2.5,
        intervalDays INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_notebook_created_at ON notebook_items (createdAt);

      CREATE TABLE IF NOT EXISTS review_cards (
        id TEXT PRIMARY KEY,
        notebookItemId TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        metadata TEXT,
        frontContent TEXT,
        backContent TEXT,
        createdAt TEXT NOT NULL,
        lastUsedAt TEXT,
        usageCount INTEGER DEFAULT 0,
        FOREIGN KEY (notebookItemId) REFERENCES notebook_items(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_review_cards_item_id ON review_cards (notebookItemId);

      CREATE TABLE IF NOT EXISTS review_tasks (
        id TEXT PRIMARY KEY,
        notebookItemId TEXT NOT NULL,
        dueAt TEXT NOT NULL,
        lastReviewedAt TEXT,
        intervalDays INTEGER NOT NULL,
        easeFactor REAL NOT NULL,
        repetitionCount INTEGER NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (notebookItemId) REFERENCES notebook_items(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_review_tasks_due_at ON review_tasks (dueAt);
      CREATE INDEX IF NOT EXISTS idx_review_tasks_item_id ON review_tasks (notebookItemId);
    `);

  // Schema Migration: Add missing columns if they don't exist
  const ensureColumn = (table: string, column: string, definition: string) => {
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasColumn = tableInfo.some((col: any) => col.name === column);
    if (!hasColumn) {
      try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
      } catch (e) {
        console.warn(`[sqlite] failed to add column ${column} to ${table}`, e);
      }
    }
  };

  ensureColumn("notebook_items", "srsLevel", "INTEGER DEFAULT 0");
  ensureColumn("notebook_items", "nextReviewAt", "TEXT");
  ensureColumn("notebook_items", "lastReviewedAt", "TEXT");
  ensureColumn("notebook_items", "lastDifficulty", "TEXT");
  ensureColumn("notebook_items", "easeFactor", "REAL DEFAULT 2.5");
  ensureColumn("notebook_items", "intervalDays", "INTEGER DEFAULT 0");
  ensureColumn("review_cards", "content", "TEXT");
  ensureColumn("review_cards", "metadata", "TEXT");
  ensureColumn("review_cards", "frontContent", "TEXT");
  ensureColumn("review_cards", "backContent", "TEXT");
  ensureColumn("review_tasks", "lastReviewedAt", "TEXT");
  ensureColumn("review_tasks", "intervalDays", "INTEGER DEFAULT 1");
  ensureColumn("review_tasks", "easeFactor", "REAL DEFAULT 2.5");
  ensureColumn("review_tasks", "repetitionCount", "INTEGER DEFAULT 0");
  ensureColumn("review_tasks", "status", "TEXT DEFAULT 'pending'");

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_notebook_next_review ON notebook_items (nextReviewAt);");
  } catch (e) {
    console.warn("[sqlite] failed to create idx_notebook_next_review", e);
  }
};

const resolveSqlite = (): any | null => {
  if (isBrowser) return null;
  try {
    if (sharedDb) {
      ensureSchema(sharedDb);
      return sharedDb;
    }
    // Defer requires to server runtime to avoid bundling in the client
    const fs = require("fs") as typeof import("fs");
    // Lazy require to avoid bundling into client
    const Database = require("better-sqlite3");
    const storageRoot = resolveStorageRoot();
    fs.mkdirSync(storageRoot, { recursive: true });
    const dbPath = path.join(storageRoot, "oralflow.db");
    sharedDb = new Database(dbPath);
    ensureSchema(sharedDb);
    return sharedDb;
  } catch (err) {
    console.warn("[sqlite] failed to initialize; JSON fallback disabled", err);
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
      console.warn("[sqlite] ScenarioRepository unavailable; JSON fallback disabled.");
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
      console.warn("[sqlite] NotebookRepository unavailable; JSON fallback disabled.");
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
      // SRS fields
      srsLevel: row.srsLevel ?? 0,
      nextReviewAt: row.nextReviewAt ?? new Date().toISOString(), // Default to now if missing? Or null?
      lastReviewedAt: row.lastReviewedAt ?? null,
      lastDifficulty: row.lastDifficulty ?? null,
      easeFactor: row.easeFactor ?? 2.5,
      intervalDays: row.intervalDays ?? 0,
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
        `INSERT INTO notebook_items (
           id, phrase, meaning, usageNotes, variants, exampleSentences, contextSentence, 
           ipa, spokenNotes, source, sourceDetails, tags, locale, createdAt, updatedAt,
           srsLevel, nextReviewAt, lastReviewedAt, lastDifficulty, easeFactor, intervalDays
         )
         VALUES (
           @id, @phrase, @meaning, @usageNotes, @variants, @exampleSentences, @contextSentence, 
           @ipa, @spokenNotes, @source, @sourceDetails, @tags, @locale, @createdAt, @updatedAt,
           @srsLevel, @nextReviewAt, @lastReviewedAt, @lastDifficulty, @easeFactor, @intervalDays
         )
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
           updatedAt=excluded.updatedAt,
           srsLevel=excluded.srsLevel,
           nextReviewAt=excluded.nextReviewAt,
           lastReviewedAt=excluded.lastReviewedAt,
           lastDifficulty=excluded.lastDifficulty,
           easeFactor=excluded.easeFactor,
           intervalDays=excluded.intervalDays`
      )
      .run({
        ...entity,
        variants: stringifyArray(entity.variants),
        exampleSentences: stringifyArray(entity.exampleSentences),
        tags: stringifyArray(entity.tags),
        srsLevel: entity.srsLevel ?? 0,
        nextReviewAt: entity.nextReviewAt ?? new Date().toISOString(),
        lastReviewedAt: entity.lastReviewedAt ?? null,
        lastDifficulty: entity.lastDifficulty ?? null,
        easeFactor: entity.easeFactor ?? 2.5,
        intervalDays: entity.intervalDays ?? 0,
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
      `INSERT INTO notebook_items (
         id, phrase, meaning, usageNotes, variants, exampleSentences, contextSentence, 
         ipa, spokenNotes, source, sourceDetails, tags, locale, createdAt, updatedAt,
         srsLevel, nextReviewAt, lastReviewedAt, lastDifficulty, easeFactor, intervalDays
       )
       VALUES (
         @id, @phrase, @meaning, @usageNotes, @variants, @exampleSentences, @contextSentence, 
         @ipa, @spokenNotes, @source, @sourceDetails, @tags, @locale, @createdAt, @updatedAt,
         @srsLevel, @nextReviewAt, @lastReviewedAt, @lastDifficulty, @easeFactor, @intervalDays
       )`
    );
    const trx = this.db.transaction((rows: NotebookItem[]) => {
      this.db.prepare("DELETE FROM notebook_items").run();
      for (const row of rows) {
        insert.run({
          ...row,
          variants: stringifyArray(row.variants),
          exampleSentences: stringifyArray(row.exampleSentences),
          tags: stringifyArray(row.tags),
          srsLevel: row.srsLevel ?? 0,
          nextReviewAt: row.nextReviewAt ?? new Date().toISOString(),
          lastReviewedAt: row.lastReviewedAt ?? null,
          lastDifficulty: row.lastDifficulty ?? null,
          easeFactor: row.easeFactor ?? 2.5,
          intervalDays: row.intervalDays ?? 0,
        });
      }
    });
    trx(entities);
  }
}

export class ReviewCardRepository {
  private readonly fileRepo?: GenericRepository<ReviewCard>;
  private readonly db: any | null;

  constructor(private readonly adapter?: StorageAdapter) {
    if (adapter) {
      this.fileRepo = new GenericRepository<ReviewCard>(adapter, COLLECTIONS.reviewCards);
      this.db = null;
      return;
    }
    this.db = resolveSqlite();
    if (!this.db) {
      console.warn("[sqlite] ReviewCardRepository unavailable; JSON fallback disabled.");
    }
  }

  private mapRow(row: any): ReviewCard {
    const parseJson = (value?: string | null) => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const content = parseJson(row.content) as any;
    const legacyFront = parseJson(row.frontContent) as any;
    const legacyBack = parseJson(row.backContent) as any;

    const fallbackContext =
      legacyFront?.context ??
      content?.front?.context ??
      content?.front?.prompt ??
      "";
    const fallbackTask =
      legacyFront?.task ??
      content?.front?.prompt ??
      "";
    const fallbackCue =
      legacyFront?.cue ??
      content?.front?.cue ??
      "";
    const fallbackAnswer =
      legacyBack?.referenceAnswer ??
      content?.back?.referenceAnswer ??
      "";

    const frontCandidate = content?.frontContent ?? legacyFront ?? content?.front ?? {};
    const backCandidate = content?.backContent ?? legacyBack ?? content?.back ?? {};

    const resolvedContext = frontCandidate?.context ?? frontCandidate?.prompt ?? fallbackContext;
    const resolvedTask = frontCandidate?.task ?? frontCandidate?.prompt ?? fallbackTask;
    const resolvedCue = frontCandidate?.cue ?? fallbackCue;
    const resolvedAnswer = backCandidate?.referenceAnswer ?? fallbackAnswer;

    return {
      id: row.id,
      notebookItemId: row.notebookItemId,
      type: row.type,
      content: {
        frontContent: {
          context: resolvedContext ?? "",
          task: resolvedTask ?? "",
          cue: resolvedCue ?? "",
        },
        backContent: {
          referenceAnswer: resolvedAnswer ?? "",
        },
      },
      metadata: parseJson(row.metadata),
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt ?? null,
      usageCount: row.usageCount ?? 0,
    };
  }

  async list(): Promise<ReviewCard[]> {
    if (this.fileRepo) {
      return this.fileRepo.list();
    }
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM review_cards ORDER BY createdAt DESC");
    const rows = stmt.all();
    return rows.map((r: any) => this.mapRow(r));
  }

  async listByItem(notebookItemId: string): Promise<ReviewCard[]> {
    if (this.fileRepo) {
      const records = await this.fileRepo.list();
      return records.filter((item) => item.notebookItemId === notebookItemId);
    }
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM review_cards WHERE notebookItemId = ? ORDER BY lastUsedAt ASC");
    const rows = stmt.all(notebookItemId);
    return rows.map((r: any) => this.mapRow(r));
  }

  async getById(id: string): Promise<ReviewCard | null> {
    if (this.fileRepo) {
      return this.fileRepo.getById(id);
    }
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM review_cards WHERE id = ?");
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  async upsert(entity: ReviewCard): Promise<ReviewCard> {
    if (this.fileRepo) {
      await this.fileRepo.upsert(entity);
      return entity;
    }
    if (!this.db) return entity;
    this.db
      .prepare(
        `INSERT INTO review_cards (id, notebookItemId, type, content, metadata, frontContent, backContent, createdAt, lastUsedAt, usageCount)
         VALUES (@id, @notebookItemId, @type, @content, @metadata, @frontContent, @backContent, @createdAt, @lastUsedAt, @usageCount)
         ON CONFLICT(id) DO UPDATE SET
           notebookItemId=excluded.notebookItemId,
           type=excluded.type,
           content=excluded.content,
           metadata=excluded.metadata,
           frontContent=excluded.frontContent,
           backContent=excluded.backContent,
           lastUsedAt=excluded.lastUsedAt,
           usageCount=excluded.usageCount`
      )
      .run({
        ...entity,
        content: JSON.stringify(entity.content),
        metadata: JSON.stringify(entity.metadata ?? null),
        frontContent: JSON.stringify(entity.content.frontContent),
        backContent: JSON.stringify(entity.content.backContent),
      });
    return entity;
  }
  async delete(id: string): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.delete(id);
      return;
    }
    if (!this.db) return;
    this.db.prepare("DELETE FROM review_cards WHERE id = ?").run(id);
  }

  async deleteAll(): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.replaceAll([]);
      return;
    }
    if (!this.db) return;
    this.db.prepare("DELETE FROM review_cards").run();
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

export class ReviewTaskRepository {
  private readonly fileRepo?: GenericRepository<ReviewTask>;
  private readonly db: any | null;

  constructor(private readonly adapter?: StorageAdapter) {
    if (adapter) {
      this.fileRepo = new GenericRepository<ReviewTask>(adapter, COLLECTIONS.reviewTasks);
      this.db = null;
      return;
    }
    this.db = resolveSqlite();
    if (!this.db) {
      console.warn("[sqlite] ReviewTaskRepository unavailable; JSON fallback disabled.");
    }
  }

  private mapRow(row: any): ReviewTask {
    return {
      id: row.id,
      notebookItemId: row.notebookItemId,
      dueAt: row.dueAt,
      lastReviewedAt: row.lastReviewedAt ?? null,
      intervalDays: row.intervalDays ?? 1,
      easeFactor: row.easeFactor ?? 2.5,
      repetitionCount: row.repetitionCount ?? 0,
      status: row.status ?? "pending",
    };
  }

  async list(): Promise<ReviewTask[]> {
    if (this.fileRepo) {
      return this.fileRepo.list();
    }
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM review_tasks ORDER BY dueAt ASC");
    const rows = stmt.all();
    return rows.map((r: any) => this.mapRow(r));
  }

  async getById(id: string): Promise<ReviewTask | null> {
    if (this.fileRepo) {
      return this.fileRepo.getById(id);
    }
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM review_tasks WHERE id = ?");
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  async upsert(entity: ReviewTask): Promise<ReviewTask> {
    if (this.fileRepo) {
      await this.fileRepo.upsert(entity);
      return entity;
    }
    if (!this.db) return entity;
    this.db
      .prepare(
        `INSERT INTO review_tasks (id, notebookItemId, dueAt, lastReviewedAt, intervalDays, easeFactor, repetitionCount, status)
         VALUES (@id, @notebookItemId, @dueAt, @lastReviewedAt, @intervalDays, @easeFactor, @repetitionCount, @status)
         ON CONFLICT(id) DO UPDATE SET
           notebookItemId=excluded.notebookItemId,
           dueAt=excluded.dueAt,
           lastReviewedAt=excluded.lastReviewedAt,
           intervalDays=excluded.intervalDays,
           easeFactor=excluded.easeFactor,
           repetitionCount=excluded.repetitionCount,
           status=excluded.status`
      )
      .run(entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.delete(id);
      return;
    }
    if (!this.db) return;
    this.db.prepare("DELETE FROM review_tasks WHERE id = ?").run(id);
  }

  async replaceAll(entities: ReviewTask[]): Promise<void> {
    if (this.fileRepo) {
      await this.fileRepo.replaceAll(entities);
      return;
    }
    if (!this.db) return;
    const insert = this.db.prepare(
      `INSERT INTO review_tasks (
         id, notebookItemId, dueAt, lastReviewedAt, intervalDays, easeFactor, repetitionCount, status
       )
       VALUES (
         @id, @notebookItemId, @dueAt, @lastReviewedAt, @intervalDays, @easeFactor, @repetitionCount, @status
       )`
    );
    const trx = this.db.transaction((rows: ReviewTask[]) => {
      this.db.prepare("DELETE FROM review_tasks").run();
      for (const row of rows) {
        insert.run(row);
      }
    });
    trx(entities);
  }
}

export const createInMemoryRepositories = (adapter: StorageAdapter = new InMemoryStorageAdapter()) => ({
  scenarios: new ScenarioRepository(adapter),
  sessions: new ConversationSessionRepository(adapter),
  evaluationRecords: new EvaluationRecordRepository(adapter),
  evaluationReports: new SessionEvaluationReportRepository(adapter),
  notebook: new NotebookRepository(adapter),
  reviewTasks: new ReviewTaskRepository(adapter),
  reviewCards: new ReviewCardRepository(adapter),
});
