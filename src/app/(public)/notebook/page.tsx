import React from "react";
import { NotebookCard } from "../../../components/notebook/NotebookCard";
import { NotebookService } from "../../../domains/notes/notebook-service";
import { createInMemoryRepositories } from "../../../services/persistence/repositories";

const repositories = createInMemoryRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });

export default async function NotebookPage() {
  const items = await notebookService.list();

  return (
    <main className="p-8 lg:p-12 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Notebook</h1>
          <p className="text-custom-text-dark/60 text-base font-normal leading-normal">Your saved expressions and notes.</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 border border-custom-border shadow-sm text-center">
          <p className="text-lg font-bold text-custom-text-dark">No notebook items yet</p>
          <p className="text-custom-text-dark/60 mt-1">
            Save from StW, Zen, or Ask to see them here.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a className="text-custom-primary font-bold hover:underline" href="/ask">
              Try Ask
            </a>
            <a className="text-custom-primary font-bold hover:underline" href="/scenarios/create">
              Scenario Studio
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <NotebookCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
