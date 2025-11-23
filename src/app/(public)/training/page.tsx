import React from "react";
import { ReviewSession } from "../../../components/training/ReviewSession";
import { createInMemoryRepositories } from "../../../services/persistence/repositories";
import { applyRating } from "../../../domains/training/rating-service";

const repositories = createInMemoryRepositories();

export default async function TrainingPage() {
  const existing = await repositories.reviewTasks.list();
  const tasks = existing;

  const handleRate = async (taskId: string, rating: "again" | "hard" | "good" | "easy") => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = applyRating(task, rating);
    await repositories.reviewTasks.upsert(next);
  };

  return (
    <main className="min-h-screen bg-surface text-white p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Training</h1>
        <p className="text-white/70">Review and practice your saved items.</p>
      </header>

      <ReviewSession tasks={tasks} onRate={handleRate} />
    </main>
  );
}
