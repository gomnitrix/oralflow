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
        `[verify] LOCAL_STORAGE_PATH points to local_storage; using ${DEFAULT_STORAGE_ROOT} instead.`
      );
      return DEFAULT_STORAGE_ROOT;
    }
    return envPath;
  }
  return DEFAULT_STORAGE_ROOT;
};

const storageRoot = resolveStorageRoot();
const dbPath = path.join(storageRoot, "oralflow.db");

if (!fs.existsSync(dbPath)) {
  console.error(`[verify] SQLite database not found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);

const issues = [];
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((row) => row.name);

const requireTable = (name) => {
  if (!tables.includes(name)) {
    issues.push(`Missing table: ${name}`);
    return false;
  }
  return true;
};

const count = (sql, params = []) => db.prepare(sql).get(params)["count"];

if (requireTable("notebook_items")) {
  const invalidEase = count("SELECT COUNT(*) as count FROM notebook_items WHERE easeFactor IS NULL OR easeFactor < 1.3");
  const invalidInterval = count("SELECT COUNT(*) as count FROM notebook_items WHERE intervalDays IS NULL OR intervalDays < 0");
  const invalidSrs = count("SELECT COUNT(*) as count FROM notebook_items WHERE srsLevel IS NULL OR srsLevel < 0");
  const invalidDifficulty = count(
    "SELECT COUNT(*) as count FROM notebook_items WHERE lastDifficulty IS NOT NULL AND lastDifficulty NOT IN ('forgot','hard','good','easy')"
  );
  if (invalidEase) issues.push(`Notebook items with invalid easeFactor: ${invalidEase}`);
  if (invalidInterval) issues.push(`Notebook items with invalid intervalDays: ${invalidInterval}`);
  if (invalidSrs) issues.push(`Notebook items with invalid srsLevel: ${invalidSrs}`);
  if (invalidDifficulty) issues.push(`Notebook items with invalid lastDifficulty: ${invalidDifficulty}`);
}

if (requireTable("review_tasks")) {
  const invalidEase = count("SELECT COUNT(*) as count FROM review_tasks WHERE easeFactor IS NULL OR easeFactor < 1.3");
  const invalidInterval = count("SELECT COUNT(*) as count FROM review_tasks WHERE intervalDays IS NULL OR intervalDays < 1");
  const invalidReps = count("SELECT COUNT(*) as count FROM review_tasks WHERE repetitionCount IS NULL OR repetitionCount < 0");
  const invalidStatus = count(
    "SELECT COUNT(*) as count FROM review_tasks WHERE status IS NULL OR status NOT IN ('pending','completed')"
  );
  if (invalidEase) issues.push(`Review tasks with invalid easeFactor: ${invalidEase}`);
  if (invalidInterval) issues.push(`Review tasks with invalid intervalDays: ${invalidInterval}`);
  if (invalidReps) issues.push(`Review tasks with invalid repetitionCount: ${invalidReps}`);
  if (invalidStatus) issues.push(`Review tasks with invalid status: ${invalidStatus}`);

  if (tables.includes("notebook_items")) {
    const orphanedTasks = count(
      "SELECT COUNT(*) as count FROM review_tasks LEFT JOIN notebook_items ON review_tasks.notebookItemId = notebook_items.id WHERE notebook_items.id IS NULL"
    );
    if (orphanedTasks) issues.push(`Review tasks without notebook items: ${orphanedTasks}`);
  }
}

if (requireTable("review_cards")) {
  if (tables.includes("notebook_items")) {
    const orphanedCards = count(
      "SELECT COUNT(*) as count FROM review_cards LEFT JOIN notebook_items ON review_cards.notebookItemId = notebook_items.id WHERE notebook_items.id IS NULL"
    );
    if (orphanedCards) issues.push(`Review cards without notebook items: ${orphanedCards}`);
  }
}

if (issues.length) {
  console.warn("[verify] Data integrity issues found:");
  issues.forEach((issue) => console.warn(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log("[verify] SRS data integrity checks passed.");
}
