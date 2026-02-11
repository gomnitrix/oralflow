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

  it("assigns different intervals for hard, good, and easy", () => {
    const task = createReviewTask({
      notebookItemId: "n2",
      dueAt: new Date().toISOString(),
      lastReviewedAt: null,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitionCount: 1,
      status: "pending",
    });

    const hard = scheduleNext(task, "hard");
    const good = scheduleNext(task, "good");
    const easy = scheduleNext(task, "easy");

    expect(hard.intervalDays).toBeLessThan(good.intervalDays);
    expect(good.intervalDays).toBeLessThan(easy.intervalDays);
  });

  it("grows intervals on consecutive easy ratings", () => {
    const task = createReviewTask({
      notebookItemId: "n3",
      dueAt: new Date().toISOString(),
      lastReviewedAt: null,
      intervalDays: 2,
      easeFactor: 2.5,
      repetitionCount: 2,
      status: "pending",
    });

    const first = scheduleNext(task, "easy");
    const second = scheduleNext(first, "easy");

    expect(second.intervalDays).toBeGreaterThan(first.intervalDays);
  });
});
