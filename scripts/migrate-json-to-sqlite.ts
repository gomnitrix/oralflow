import fs from "fs/promises";
import path from "path";
// Use require to avoid missing type declarations for better-sqlite3
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require("better-sqlite3") as any;
import type { ScenarioTemplate } from "../src/domains/scenario/models";
import type { NotebookItem } from "../src/domains/notes/models";

const storageRoot = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "local_storage");
const scenarioFile = path.join(storageRoot, "scenarios.json");
const notebookFile = path.join(storageRoot, "notebookItems.json");
const dbPath = path.join(storageRoot, "oralflow.db");
const db = new Database(dbPath);

const loadJson = async <T>(filePath: string): Promise<T[]> => {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      console.warn(`[migrate] File not found, skipping: ${filePath}`);
      return [];
    }
    throw error;
  }
};

const ensureStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v : String(v))).filter(Boolean);
  }
  return fallback;
};

const ensureText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return String(value);
};

const ensureDateText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
};

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
  `);
};

const migrateScenarios = (records: ScenarioTemplate[]): number => {
  if (!records.length) return 0;
  const stmt = db.prepare(
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
  );

  const run = db.transaction((rows: ScenarioTemplate[]) => {
    for (const scenario of rows) {
      stmt.run({
        ...scenario,
        subGoals: JSON.stringify(ensureStringArray(scenario.subGoals)),
        sourceText: ensureText(scenario.sourceText),
        lastPracticedAt: ensureText((scenario as any).lastPracticedAt),
        tags: JSON.stringify(ensureStringArray((scenario as any).tags ?? [])),
        createdAt: ensureDateText(scenario.createdAt),
        updatedAt: ensureDateText(scenario.updatedAt),
      });
    }
  });

  run(records);
  return records.length;
};

const migrateNotebookItems = (records: NotebookItem[]): number => {
  if (!records.length) return 0;
  const stmt = db.prepare(
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
  );

  const run = db.transaction((rows: NotebookItem[]) => {
    for (const item of rows) {
      stmt.run({
        ...item,
        variants: JSON.stringify(ensureStringArray(item.variants)),
        exampleSentences: JSON.stringify(ensureStringArray(item.exampleSentences)),
        tags: JSON.stringify(ensureStringArray((item as any).tags ?? [])),
        locale: ensureText((item as any).locale),
        createdAt: ensureDateText(item.createdAt),
        updatedAt: ensureDateText(item.updatedAt),
      });
    }
  });

  run(records);
  return records.length;
};

async function main() {
  console.log(`[migrate] Using storage root: ${storageRoot}`);
  initTables();

  const scenarios = await loadJson<ScenarioTemplate>(scenarioFile);
  const notebookItems = await loadJson<NotebookItem>(notebookFile);

  const migratedScenarios = migrateScenarios(scenarios);
  const migratedNotebook = migrateNotebookItems(notebookItems);

  console.log(`[migrate] Scenarios migrated: ${migratedScenarios}`);
  console.log(`[migrate] Notebook items migrated: ${migratedNotebook}`);
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exitCode = 1;
});
