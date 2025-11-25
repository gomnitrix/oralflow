import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { StopTheWorldShell } from "../../../../src/components/conversation/stw/StopTheWorldShell";

const mockFetch = (payload: any) =>
  Promise.resolve({
    ok: true,
    json: async () => payload,
  } as Response);

describe("StopTheWorldShell", () => {
  beforeEach(() => {
    (global as any).Audio = function () {
      return { play: jest.fn().mockResolvedValue(undefined) } as any;
    };
    (global as any).fetch = jest.fn((_: string, options?: RequestInit) => {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      if (body.action === "start") {
        return mockFetch({ reply: "Hello from AI", audioUrl: null });
      }
      if (body.action === "copilot") {
        return mockFetch({ insight: { id: "i1", bubbleId: body.bubbleId, type: "distill", title: "Tip", description: "Try this", suggestedExpressions: [] } });
      }
      return mockFetch({ reply: "", audioUrl: null });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders initial AI greeting and scenario context", async () => {
    render(
      <StopTheWorldShell
        scenarioId="scenario-1"
        scenarioTitle="Test Scenario"
        learnerRole="Learner"
        aiRole="Coach"
      />
    );

    expect(await screen.findByText("Test Scenario")).toBeInTheDocument();

    await waitFor(async () => {
      expect(await screen.findByText("Hello from AI")).toBeInTheDocument();
    });
  });
});
