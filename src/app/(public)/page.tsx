import React, { useState } from "react";
import { seedScenarios } from "../../services/persistence/seeds/scenarios";
import { Button } from "../../components/shared/Button";
import { buildLaunchpadLinks } from "../../lib/navigation/launchpad";
import { buildAdHocSession } from "../../domains/training/session-builder";

export default function HomePage() {
  const scenarios = seedScenarios();
  const [quickText, setQuickText] = useState("");
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  const launchpadLinks = buildLaunchpadLinks(scenarios[0].id);

  const runQuickTraining = () => {
    const session = buildAdHocSession(quickText || "Custom text");
    setLastSessionId(session.id);
  };

  return (
    <main className="min-h-screen bg-surface text-white p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">Dashboard</p>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {launchpadLinks.map((link) => (
            <Button key={link.href} variant="secondary" href={link.href}>
              {link.label}
            </Button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-card p-4 shadow-card space-y-3">
          <h2 className="text-lg font-semibold">Today&apos;s Reviews</h2>
          <p className="text-sm text-white/70">0 pending items</p>
          <Button variant="primary" href="/training">
            Start Reviews
          </Button>
        </div>

        <div className="rounded-2xl bg-surface-card p-4 shadow-card space-y-3">
          <h2 className="text-lg font-semibold">Quick Training</h2>
          <p className="text-sm text-white/70">Paste custom text to practice now.</p>
          <textarea
            className="w-full rounded-lg bg-surface-subtle p-2 text-white"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="Write a short paragraph to practice"
          />
          <Button variant="secondary" onClick={runQuickTraining}>
            Generate Ad-hoc Session
          </Button>
          {lastSessionId ? (
            <p className="text-xs text-white/60">Session created: {lastSessionId}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-surface-card p-4 shadow-card space-y-3">
        <h2 className="text-lg font-semibold">Scenario shortcuts</h2>
        <div className="flex gap-2 flex-wrap">
          {scenarios.map((scenario) => (
            <Button key={scenario.id} variant="secondary" href={`/scenarios?pageId=${scenario.id}`}>
              {scenario.title}
            </Button>
          ))}
        </div>
        {scenarios.length === 0 ? (
          <p className="text-sm text-white/70">
            No scenarios yet—create one in Scenario Studio or try Ask.
          </p>
        ) : null}
      </section>
    </main>
  );
}
