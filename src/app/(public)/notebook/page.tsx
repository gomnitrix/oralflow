import React from "react";
import { NotebookService } from "../../../domains/notes/notebook-service";
import { createServerRepositories } from "../../../services/persistence/server-repositories";
import { NotebookList } from "../../../components/notebook/NotebookList";

const repositories = createServerRepositories();
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

      <NotebookList initialItems={items} />
    </main>
  );
}
