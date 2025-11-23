type EventName =
  | "stw:start"
  | "stw:evaluate"
  | "stw:retry"
  | "copilot:inspiration"
  | "copilot:distill"
  | "notebook:save"
  | "zen:start"
  | "zen:end"
  | "training:rate"
  | "ask:prompt";

export interface AnalyticsEvent<TPayload = Record<string, unknown>> {
  name: EventName;
  payload?: TPayload;
  timestamp?: string;
}

export interface AnalyticsClient {
  emit: (event: AnalyticsEvent) => void;
}

export const createConsoleAnalyticsClient = (): AnalyticsClient => ({
  emit(event) {
    // Minimal stub that can be replaced with a production emitter later.
    // eslint-disable-next-line no-console
    console.debug("[analytics]", {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    });
  },
});
