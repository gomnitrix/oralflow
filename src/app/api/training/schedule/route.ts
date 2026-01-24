import { NextResponse } from "next/server";
import { trainingScheduleSchema } from "../../../../lib/validation/notes";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { buildAdHocSession, buildTrainingSession } from "../../../../domains/training/session-builder";
import { createReviewTask } from "../../../../domains/training/models";

const repositories = createServerRepositories();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trainingScheduleSchema.parse(body);

    if (parsed.mode === "adHoc") {
      if (!parsed.sourceText?.trim()) {
        return NextResponse.json({ error: "sourceText is required for ad hoc sessions." }, { status: 400 });
      }
      const session = buildAdHocSession(parsed.sourceText.trim());
      return NextResponse.json({ tasks: [], session });
    }

    const now = new Date();
    const notebookItems = await repositories.notebook.list();
    const existingTasks = await repositories.reviewTasks.list();
    const existingByNotebookId = new Map(existingTasks.map((task) => [task.notebookItemId, task]));

    const tasks = notebookItems.map((item) => {
      const existing = existingByNotebookId.get(item.id);
      if (existing) return existing;
      return createReviewTask({
        notebookItemId: item.id,
        dueAt: now.toISOString(),
        lastReviewedAt: null,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 0,
        status: "pending",
      });
    });

    await repositories.reviewTasks.replaceAll(tasks);

    const dueTasks = tasks.filter((task) => {
      if (task.status !== "pending") return false;
      return new Date(task.dueAt).getTime() <= now.getTime();
    });

    const session = buildTrainingSession({ mode: parsed.mode, tasks: dueTasks });
    return NextResponse.json({ tasks: dueTasks, session });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
