import { StopTheWorldService } from "../../../../src/domains/conversation/stw-service";

describe("StopTheWorldService", () => {
  const evaluation = { evaluate: jest.fn(async () => ({ evaluationId: "eval-1" })) };

  beforeEach(() => {
    evaluation.evaluate.mockClear();
  });

  it("walks through recording -> pending -> evaluating -> readyToSend -> sent", async () => {
    const service = new StopTheWorldService({ evaluation });

    service.startRecording();
    let session = service.finishRecording({ text: "Hello" });
    expect(session.bubbles.at(-1)?.state).toBe("pending");

    session = await service.evaluate();
    expect(evaluation.evaluate).toHaveBeenCalled();
    expect(session.bubbles.at(-1)?.state).toBe("readyToSend");

    session = service.send();
    expect(session.bubbles.at(-1)?.state).toBe("sent");
  });

  it("creates a new bubble on retry", async () => {
    const service = new StopTheWorldService({ evaluation });

    service.startRecording();
    service.finishRecording({ text: "Hi" });
    await service.evaluate();
    service.send();

    const withRetry = service.retry();
    expect(withRetry.bubbles).toHaveLength(2);
    expect(withRetry.bubbles.at(-1)?.state).toBe("recording");
  });

  it("throws when invalid transition requested", () => {
    const service = new StopTheWorldService({ evaluation });
    expect(() => service.send()).toThrowError();
  });
});
