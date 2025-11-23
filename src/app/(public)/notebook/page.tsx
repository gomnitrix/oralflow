import React from "react";
import { NotebookCard } from "../../../components/notebook/NotebookCard";
import { NotebookService } from "../../../domains/notes/notebook-service";
import { createInMemoryRepositories } from "../../../services/persistence/repositories";

const repositories = createInMemoryRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });

export default async function NotebookPage() {
  const items = await notebookService.list();

  return (
    <main className="min-h-screen bg-surface text-white p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notebook</h1>
          <p className="text-white/70">Your saved expressions and notes.</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface-card p-4 text-white shadow-card">
          <p className="text-sm font-semibold">No notebook items yet</p>
          <p className="text-xs text-white/70">
            Save from StW, Zen, or Ask to see them here.
          </p>
          <div className="flex gap-2 mt-2">
            <a className="text-accent text-sm underline" href="/ask">
              Try Ask
            </a>
            <a className="text-accent text-sm underline" href="/scenarios/create">
              Scenario Studio
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <NotebookCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
