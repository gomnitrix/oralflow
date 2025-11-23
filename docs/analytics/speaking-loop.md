# Analytics: Speaking Practice Loop (SC-001–SC-005)

| Event | When it fires | Payload |
| --- | --- | --- |
| `stw:start` | User enters Stop-the-World session | `{ scenarioId, sessionId }` |
| `stw:evaluate` | Evaluation requested for a bubble | `{ sessionId, bubbleId }` |
| `stw:retry` | Retry triggered after feedback | `{ sessionId, bubbleId }` |
| `copilot:inspiration` | Inspiration Burst request | `{ sessionId, bubbleId }` |
| `copilot:distill` | Distill request | `{ sessionId, bubbleId }` |
| `notebook:save` | Suggestion saved to notebook | `{ source, itemId, bubbleId? }` |
| `zen:start` | Zen session starts | `{ sessionId, scenarioId }` |
| `zen:end` | Zen session ends | `{ sessionId, reason }` |
| `training:rate` | Rating applied (Again/Hard/Good/Easy) | `{ taskId, rating }` |
| `ask:prompt` | Ask page prompt submitted | `{ promptLength }` |

Notes:
- The `createConsoleAnalyticsClient` stub in `src/lib/analytics/speaking-loop.ts` logs events to console with ISO timestamps.
- Replace the stub with a production emitter (e.g., PostHog/Segment) when wiring real telemetry.*** End Patch**� to=functions.apply_patch balsJsoncommentary  porchassistant to=functions.apply_patch## jsonленный ***!
