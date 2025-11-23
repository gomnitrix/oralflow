# Data Model: Oralflow Speaking Practice Loop

**Branch**: `001-speaking-practice`  
**Date**: 2025-11-23  
**Related Spec**: `/workspaces/oralflow/specs/001-speaking-practice/spec.md`

## Entities

### ScenarioTemplate

- **Fields**
  - `id`: string (stable identifier)
  - `title`: string
  - `emoji`: string
  - `description`: string
  - `learnerRole`: string
  - `aiRole`: string
  - `mainGoal`: string
  - `subGoals`: string[]
  - `sourceType`: `"manual" | "ai" | "import"`
  - `sourceText`: string | null (raw imported text if any)
  - `lastPracticedAt`: ISO datetime | null
  - `preferredMode`: `"stw" | "zen" | null`
  - `createdAt`: ISO datetime
  - `updatedAt`: ISO datetime

- **Relationships**
  - One ScenarioTemplate → many ConversationSessions.

### ConversationSession

- **Fields**
  - `id`: string
  - `scenarioId`: string (ScenarioTemplate.id)
  - `mode`: `"stw" | "zen"`
  - `startedAt`: ISO datetime
  - `endedAt`: ISO datetime | null
  - `status`: `"active" | "completed" | "aborted"`
  - `bubbles`: ConversationBubble[] (ordered)
  - `evaluationReportId`: string | null (SessionEvaluationReport.id)

- **Relationships**
  - Belongs to ScenarioTemplate.
  - Has many ConversationBubbles.
  - Optionally has one SessionEvaluationReport.

### ConversationBubble

- **Fields**
  - `id`: string
  - `sessionId`: string (ConversationSession.id)
  - `speaker`: `"user" | "ai"`
  - `text`: string
  - `audioUrl`: string | null (local reference to recording or TTS)
  - `state`: `"idle" | "recording" | "pending" | "evaluating" | "readyToSend" | "sent"`
  - `createdAt`: ISO datetime
  - `updatedAt`: ISO datetime
  - `copilotInsights`: CopilotInsight[] (Inspiration Burst or Distill outputs linked to this bubble)
  - `evaluationId`: string | null (Pronunciation/grammar evaluation for user bubbles)

### CopilotInsight

- **Fields**
  - `id`: string
  - `bubbleId`: string (ConversationBubble.id)
  - `type`: `"inspiration" | "distill"`
  - `title`: string
  - `description`: string
  - `suggestedExpressions`: ExpressionSuggestion[]

### NotebookItem

- **Fields**
  - `id`: string
  - `phrase`: string
  - `meaning`: string
  - `usageNotes`: string
  - `variants`: string[]
  - `exampleSentences`: string[]
  - `contextSentence`: string
  - `ipa`: string
  - `spokenNotes`: string
  - `source`: `"stw" | "zen" | "ask" | "training" | "manual"`
  - `sourceDetails`: string (e.g., session id + bubble id)
  - `createdAt`: ISO datetime
  - `updatedAt`: ISO datetime

### ReviewTask

- **Fields**
  - `id`: string
  - `notebookItemId`: string (NotebookItem.id)
  - `dueAt`: ISO datetime
  - `lastReviewedAt`: ISO datetime | null
  - `intervalDays`: number
  - `easeFactor`: number
  - `repetitionCount`: number
  - `status`: `"pending" | "completed"`

### TrainingSession

- **Fields**
  - `id`: string
  - `startedAt`: ISO datetime
  - `endedAt`: ISO datetime | null
  - `taskIds`: string[] (ReviewTask ids included)
  - `mode`: `"review" | "adHoc"`

### ExpressionSuggestion

- **Fields**
  - `id`: string
  - `text`: string
  - `meaning`: string
  - `usageNotes`: string
  - `examples`: string[]
  - `tone`: `"formal" | "neutral" | "casual" | "other"`
  - `origin`: `"stwInspiration" | "stwDistill" | "zenReport" | "askPage" | "adHocText"`
  - `linkedNotebookItemId`: string | null

### SessionEvaluationReport

- **Fields**
  - `id`: string
  - `sessionId`: string (ConversationSession.id)
  - `createdAt`: ISO datetime
  - `pronunciationFindings`: string[]
  - `grammarFindings`: string[]
  - `naturalnessFindings`: string[]
  - `extractedExpressionIds`: string[] (ExpressionSuggestion.id)

### EvaluationRecord

- **Fields**
  - `id`: string
  - `bubbleId`: string (ConversationBubble.id)
  - `createdAt`: ISO datetime
  - `pronunciationIssues`: string[]
  - `grammarIssues`: string[]
  - `naturalnessNotes`: string[]
  - `nativeLikeSuggestion`: string
  - `referenceAudioUrl`: string | null

## Validation Rules

- ScenarioTemplate.title must be non-empty and unique within the local dataset.
- ConversationSession.mode must be consistent with how the session was launched (StW vs Zen).
- ConversationBubble.state transitions must follow the state machine: `idle -> recording -> pending -> evaluating -> readyToSend -> sent`.
- NotebookItem.phrase and meaning must be non-empty; example sentences should contain the phrase.
- ReviewTask.dueAt must always be in the future when status is `"pending"`.
- ExpressionSuggestion.linkedNotebookItemId, when present, must reference an existing NotebookItem.

## State Transitions (High-Level)

- **ReviewTask**
  - `pending` → `completed` when rating is applied in a session (Again/Hard/Good/Easy).
  - Upon rating, a new ReviewTask may be created or the existing one updated with new `dueAt`, `intervalDays`, and `easeFactor`.

- **ConversationSession**
  - `status: active` on creation.
  - `status: completed` when the learner explicitly ends the session.
  - `status: aborted` if the session is interrupted (e.g., connectivity loss) and the learner does not resume.

- **ConversationBubble**
  - `idle` → `recording` when recording begins.
  - `recording` → `pending` when recording stops and audio is captured.
  - `pending` → `evaluating` when evaluation starts.
  - `evaluating` → `readyToSend` when evaluation results are available.
  - `readyToSend` → `sent` when learner presses Send.

## Notes

- All timestamps are stored as ISO datetime strings to keep the model storage-agnostic.
- This data model assumes single-user context; multi-user expansion would add a `userId` field to top-level entities (ScenarioTemplate, ConversationSession, NotebookItem, ReviewTask, TrainingSession).
