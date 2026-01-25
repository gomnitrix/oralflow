import { NextResponse } from "next/server";
import { trainingItemRateSchema } from "@/lib/validation/training";
import { createServerRepositories } from "@/services/persistence/server-repositories";
import { createReviewTask } from "@/domains/training/models";
import { scheduleNext, type Rating } from "@/domains/training/srs-engine";

const repositories = createServerRepositories();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingItemRateSchema.parse(body);
    const rating = parsed.rating as Rating;

    let task = parsed.taskId ? await repositories.reviewTasks.getById(parsed.taskId) : null;

    if (!task && parsed.notebookItemId) {
      const existing = await repositories.reviewTasks.list();
      task = existing.find((entry) => entry.notebookItemId === parsed.notebookItemId) ?? null;
    }

    if (!task) {
      if (!parsed.notebookItemId) {
        return NextResponse.json({ error: "Review task not found." }, { status: 404 });
      }
      task = createReviewTask({
        notebookItemId: parsed.notebookItemId,
        dueAt: new Date().toISOString(),
        lastReviewedAt: null,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 0,
        status: "pending",
      });
    }

    const nextTask = scheduleNext(task, rating);
    await repositories.reviewTasks.upsert(nextTask);

    const item = await repositories.notebook.getById(nextTask.notebookItemId);
    let updatedItem = null as typeof item;
    if (item) {
      updatedItem = {
        ...item,
        srsLevel: Math.max(0, nextTask.repetitionCount),
        nextReviewAt: nextTask.dueAt,
        lastReviewedAt: nextTask.lastReviewedAt ?? new Date().toISOString(),
        lastDifficulty: rating,
        easeFactor: nextTask.easeFactor,
        intervalDays: nextTask.intervalDays,
        updatedAt: new Date().toISOString(),
      };
      await repositories.notebook.upsert(updatedItem);
    }

    return NextResponse.json({ task: nextTask, item: updatedItem });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
