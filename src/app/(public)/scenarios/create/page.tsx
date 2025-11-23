'use client';

import React, { useState } from "react";
import { StudioForm } from "../../../../components/scenario/StudioForm";
import { seedScenarios } from "../../../../services/persistence/seeds/scenarios";

export default function ScenarioCreatePage() {
  const [defaultScenario] = seedScenarios();
  const [message, setMessage] = useState("");

  return (
    <main className="min-h-screen bg-surface text-white p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Scenario Studio</h1>
        <p className="text-white/70">Draft, generate, or import practice scenarios.</p>
      </header>

      <StudioForm
        initialTitle={defaultScenario.title}
        onSubmit={(values) => setMessage(`Saved scenario: ${values.title}`)}
      />

      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </main>
  );
}
