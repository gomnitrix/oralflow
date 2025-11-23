import { createScenarioTemplate } from "../../../domains/scenario/models";

export const defaultScenario = createScenarioTemplate({
  title: "Coffee Chat with a Mentor",
  emoji: "☕️",
  description: "Practice discussing goals and getting feedback in a relaxed chat.",
  learnerRole: "Learner",
  aiRole: "Mentor",
  mainGoal: "Share your career goal and ask for feedback.",
  subGoals: ["Practice small talk", "Ask clarifying questions"],
  sourceType: "manual",
  sourceText: null,
  preferredMode: "stw",
});

export const seedScenarios = () => [defaultScenario];
