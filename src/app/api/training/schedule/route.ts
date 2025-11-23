import { NextResponse } from "next/server";
import { trainingScheduleSchema } from "../../../../lib/validation/notes";
import { createInMemoryRepositories } from "../../../../services/persistence/repositories";
import { buildTrainingSession } from "../../../../domains/training/session-builder";
import { createReviewTask } from "../../../../domains/training/models";

const repositories = createInMemoryRepositories();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingScheduleSchema.parse(body);

    const tasks = [
      createReviewTask({
        notebookItemId: "demo",
        dueAt: new Date().toISOString(),
        lastReviewedAt: null,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 0,
        status: "pending",
      }),
    ];
    await repositories.reviewTasks.replaceAll(tasks);

    const session = buildTrainingSession({ mode: parsed.mode, tasks });
    return NextResponse.json({ tasks, session });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
