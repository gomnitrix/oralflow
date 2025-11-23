# Realtime Contract: Zen Mode Conversation

**Channel**: `src/app/realtime/zen/route.ts`  
**Purpose**: Stream audio and text between learner and AI agent with low latency while tracking session id and conversation bubbles.

## Connection

- Client connects via WebSocket or provider-specific Realtime endpoint.
- Query parameters:
  - `sessionId`: string (ConversationSession.id)

## Client → Server Messages

- `user.audio.chunk`
  - `sessionId`: string
  - `chunk`: binary audio payload
  - `sequence`: number
- `user.audio.end`
  - `sessionId`: string
  - `utteranceId`: string
- `control.endSession`
  - `sessionId`: string

## Server → Client Messages

- `ai.audio.chunk`
  - `sessionId`: string
  - `chunk`: binary audio payload
  - `sequence`: number
- `ai.audio.end`
  - `sessionId`: string
  - `utteranceId`: string
- `ai.text.delta`
  - `sessionId`: string
  - `utteranceId`: string
  - `textDelta`: string
- `session.state`
  - `sessionId`: string
  - `state`: `"listening" | "thinking" | "speaking" | "ended"`

## Notes

- The realtime adapter in `services/ai/client.ts` is responsible for translating between provider-native messages and these domain-level events.
