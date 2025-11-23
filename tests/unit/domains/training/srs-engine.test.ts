import { scheduleNext } from "../../../../src/domains/training/srs-engine";
import { createReviewTask } from "../../../../src/domains/training/models";

describe("srs-engine scheduleNext", () => {
  it("increments repetition and moves due date forward", () => {
    const task = createReviewTask({
      notebookItemId: "n1",
      dueAt: new Date().toISOString(),
      lastReviewedAt: null,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitionCount: 0,
      status: "pending",
    });

    const next = scheduleNext(task, "good");
    expect(next.repetitionCount).toBe(1);
    expect(new Date(next.dueAt).getTime()).toBeGreaterThan(Date.now());
  });
});
