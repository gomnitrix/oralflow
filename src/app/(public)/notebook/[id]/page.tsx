import React from "react";
import { notFound } from "next/navigation";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { NotebookService } from "../../../../domains/notes/notebook-service";
import { TrainingCardDirectory } from "../../../../components/notebook/TrainingCardDirectory";
import { Button } from "../../../../components/shared/Button";

interface NotebookItemPageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

const repositories = createServerRepositories();
const notebookService = new NotebookService({ repository: repositories.notebook });

export default async function NotebookItemPage({ params }: NotebookItemPageProps) {
  const item = await notebookService.getById(params.id);
  if (!item) notFound();

  return (
    <main className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-custom-text-dark text-3xl font-black leading-tight tracking-tighter">{item.phrase}</h1>
          <p className="text-custom-text-dark/60 text-base font-normal leading-normal">{item.meaning}</p>
        </div>
        <Button variant="ghost" href="/notebook">Back to Notebook</Button>
      </header>

      <section className="rounded-2xl border border-custom-border bg-white p-6 shadow-sm space-y-3 text-sm text-custom-text-dark/80">
        <div>
          <p className="text-xs font-semibold uppercase text-custom-text-dark/50">Usage Notes</p>
          <p>{item.usageNotes || "—"}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-custom-text-dark/70">
          <div>
            <p className="font-semibold uppercase">Context</p>
            <p>{item.contextSentence || "—"}</p>
          </div>
          <div>
            <p className="font-semibold uppercase">Source</p>
            <p>{item.source} · {item.sourceDetails || "—"}</p>
          </div>
          <div>
            <p className="font-semibold uppercase">Next Review</p>
            <p>{item.nextReviewAt || "—"}</p>
          </div>
          <div>
            <p className="font-semibold uppercase">Last Difficulty</p>
            <p>{item.lastDifficulty || "—"}</p>
          </div>
        </div>
        {item.exampleSentences.length ? (
          <div>
            <p className="text-xs font-semibold uppercase text-custom-text-dark/50">Examples</p>
            <ul className="list-disc list-inside text-sm text-custom-text-dark/70">
              {item.exampleSentences.map((sentence: string) => (
                <li key={sentence}>{sentence}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <TrainingCardDirectory notebookItemId={item.id} />
    </main>
  );
}
