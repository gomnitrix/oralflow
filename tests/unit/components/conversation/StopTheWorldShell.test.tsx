import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StopTheWorldShell } from "../../../../src/components/conversation/stw/StopTheWorldShell";

describe("StopTheWorldShell", () => {
  it("navigates bubbles with J/K keys", async () => {
    render(<StopTheWorldShell scenarioTitle="Test Scenario" />);

    fireEvent.click(screen.getByText("Record"));
    fireEvent.click(screen.getByText("Stop"));
    fireEvent.click(screen.getByText("Evaluate"));
    await Promise.resolve();
    fireEvent.click(screen.getByText("Send"));
    fireEvent.click(screen.getByText("Retry (J/K navigate)"));

    const bubbles = screen.getAllByText(/State:/i);
    expect(bubbles.length).toBeGreaterThan(1);

    fireEvent.keyDown(window, { key: "j" });
    const active = document.querySelectorAll(".ring-2");
    expect(active.length).toBeGreaterThan(0);

    fireEvent.keyDown(window, { key: "k" });
    const activeAfter = document.querySelectorAll(".ring-2");
    expect(activeAfter.length).toBeGreaterThan(0);
  });
});
