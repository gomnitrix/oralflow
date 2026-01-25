#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), "data", "storage");

const resolveStorageRoot = () => {
  const envPath = process.env.LOCAL_STORAGE_PATH;
  if (envPath) {
    const normalized = path.resolve(envPath);
    if (path.basename(normalized) === "local_storage") {
      console.warn(
        `[schema] LOCAL_STORAGE_PATH points to local_storage; using ${DEFAULT_STORAGE_ROOT} instead.`
      );
      return DEFAULT_STORAGE_ROOT;
    }
    return envPath;
  }
  return DEFAULT_STORAGE_ROOT;
};

const storageRoot = resolveStorageRoot();
fs.mkdirSync(storageRoot, { recursive: true });
const dbPath = path.join(storageRoot, "oralflow.db");
const db = new Database(dbPath);

const initTables = () => {
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
    CREATE INDEX IF NOT EXISTS idx_notebook_next_review ON notebook_items (nextReviewAt);

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
};

const ensureColumn = (table, column, definition) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!info.length) return;
  const hasColumn = info.some((col) => col.name === column);
  if (!hasColumn) {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    } catch (error) {
      console.warn(`[schema] failed to add column ${column} to ${table}`, error);
    }
  }
};

const warnDeprecatedJson = () => {
  const deprecated = ["scenarios.json", "notebookItems.json", "evaluationRecords.json"];
  for (const filename of deprecated) {
    const filePath = path.join(storageRoot, filename);
    if (fs.existsSync(filePath)) {
      console.warn(`[schema] Deprecated JSON detected (ignored): ${filePath}`);
    }
  }
};

function main() {
  console.log(`[schema] Using storage root: ${storageRoot}`);
  initTables();

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

  warnDeprecatedJson();
  console.log("[schema] SQLite schema check complete. JSON sources are ignored.");
}

main();
