export type ConversationMode = "stw" | "zen";

export interface LaunchpadLink {
  label: string;
  href: string;
  mode: ConversationMode;
}

export const buildLaunchpadLinks = (scenarioId: string): LaunchpadLink[] => [
  {
    label: "Start Stop-the-World",
    href: `/stw?scenarioId=${scenarioId}`,
    mode: "stw",
  },
  {
    label: "Start Zen Mode",
    href: `/zen?scenarioId=${scenarioId}`,
    mode: "zen",
  },
];
