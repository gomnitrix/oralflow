import React from "react";
import { buildLaunchpadLinks } from "../../lib/navigation/launchpad";
import { Button } from "../shared/Button";

export interface ScenarioLaunchpadProps {
  scenarioId: string;
  compact?: boolean;
}

export const ScenarioLaunchpad: React.FC<ScenarioLaunchpadProps> = ({ scenarioId, compact }) => {
  const links = buildLaunchpadLinks(scenarioId);

  return (
    <div className={`rounded-xl bg-custom-bg border border-custom-border p-4 text-custom-text-dark ${compact ? "space-y-2" : "space-y-3"}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-custom-text-dark/50">Launchpad</p>
      <div className="flex gap-2 flex-wrap">
        {links.map((link) => (
          <Button key={link.href} variant="secondary" href={link.href}>
            {link.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
