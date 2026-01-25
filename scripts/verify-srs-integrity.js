const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), "data", "storage");

const resolveStorageRoot = () => {
    const envPath = process.env.LOCAL_STORAGE_PATH;
    if (envPath) {
        return path.resolve(envPath);
    }
    return DEFAULT_STORAGE_ROOT;
};

const storageRoot = resolveStorageRoot();
const dbPath = path.join(storageRoot, "oralflow.db");

if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
    process.exit(1);
}

const db = new Database(dbPath);

console.log(`[Verify] Checking database integrity at ${dbPath}...`);

// Check Notebook Items
const items = db.prepare("SELECT * FROM notebook_items").all();
console.log(`[Verify] Found ${items.length} notebook items.`);

let itemsWithIssues = 0;
for (const item of items) {
    const issues = [];
    if (typeof item.srsLevel !== "number") issues.push("Missing/Invalid srsLevel");
    if (!item.nextReviewAt) issues.push("Missing nextReviewAt");
    if (typeof item.easeFactor !== "number" || item.easeFactor < 1.3) issues.push(`Invalid easeFactor: ${item.easeFactor}`);
    if (typeof item.intervalDays !== "number") issues.push("Missing intervalDays");

    if (issues.length > 0) {
        console.warn(`[Item ${item.id}] Issues: ${issues.join(", ")}`);
        itemsWithIssues++;
    }
}

// Check Review Tasks
const tasks = db.prepare("SELECT * FROM review_tasks").all();
console.log(`[Verify] Found ${tasks.length} review tasks.`);

let tasksWithIssues = 0;
for (const task of tasks) {
    const issues = [];
    if (!task.notebookItemId) issues.push("Missing notebookItemId");
    if (!task.dueAt) issues.push("Missing dueAt");
    if (typeof task.easeFactor !== "number" || task.easeFactor < 1.3) issues.push(`Invalid easeFactor: ${task.easeFactor}`);
    if (task.status !== "pending" && task.status !== "completed") issues.push(`Invalid status: ${task.status}`);

    // Check foreign key integrity manually if needed, though SQLite enforces it if enabled.
    const linkedItem = items.find(i => i.id === task.notebookItemId);
    if (!linkedItem) issues.push(`Orphaned task (Item ${task.notebookItemId} not found)`);

    if (issues.length > 0) {
        console.warn(`[Task ${task.id}] Issues: ${issues.join(", ")}`);
        tasksWithIssues++;
    }
}

// Check Review Cards
const cards = db.prepare("SELECT * FROM review_cards").all();
console.log(`[Verify] Found ${cards.length} review cards.`);

let cardsWithIssues = 0;
for (const card of cards) {
    const issues = [];
    if (!card.notebookItemId) issues.push("Missing notebookItemId");
    if (!card.type) issues.push("Missing type");

    let content = null;
    try {
        content = JSON.parse(card.content);
    } catch (e) {
        issues.push("Invalid JSON content");
    }

    if (content) {
        if (!content.front || !content.back) issues.push("Missing front/back content");
    }

    const linkedItem = items.find(i => i.id === card.notebookItemId);
    if (!linkedItem) issues.push(`Orphaned card (Item ${card.notebookItemId} not found)`);

    if (issues.length > 0) {
        console.warn(`[Card ${card.id}] Issues: ${issues.join(", ")}`);
        cardsWithIssues++;
    }
}

console.log("\n[Verify] Summary:");
console.log(`Notebook Items with issues: ${itemsWithIssues}`);
console.log(`Review Tasks with issues: ${tasksWithIssues}`);
console.log(`Review Cards with issues: ${cardsWithIssues}`);

if (itemsWithIssues + tasksWithIssues + cardsWithIssues === 0) {
    console.log("[Verify] integrity check PASSED ✅");
} else {
    console.log("[Verify] integrity check FAILED ❌");
    process.exit(1);
}
