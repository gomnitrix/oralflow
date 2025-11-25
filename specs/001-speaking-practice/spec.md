# Feature Specification: Oralflow Speaking Practice Loop

**Feature Branch**: `001-speaking-practice`  
**Created**: 2025-11-23  
**Status**: Draft  
**Input**: User description: "Build an AI-powered English speaking practice application with Stop-the-World and Zen modes, scenario studio, coaching copilot, notebook + SRS review engine, and training/drill system."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided Stop-the-World Session (Priority: P1)

Beginner learner enters Stop-the-World (StW) mode, records an utterance inside a scenario, receives pronunciation/grammar/naturalness feedback before sending, and uses the copilot panel (Inspiration Burst + Distill) tied to the active bubble to refine their response until they feel confident enough to progress.

**Why this priority**: This flow is the primary anxiety-reducing experience that keeps hesitant learners engaged and lets them practice deliberately at their own pace.

**Independent Test**: Start a StW session from a default scenario, record at least two user bubbles, verify evaluation feedback, Inspiration Burst prompts, Distill outputs, retries, and send gating without involving any other features.

**Acceptance Scenarios**:

1. **Given** a loaded scenario conversation, **When** the learner selects an AI-generated bubble, **Then** the copilot shows Inspiration Burst suggestions with meaning, notes, examples, and a save-to-notebook control.
2. **Given** a pending user bubble, **When** evaluation runs, **Then** the learner sees pronunciation, grammar, and naturalness feedback plus at least one "A native speaker would say..." suggestion before they can press Send.
3. **Given** the learner retries an utterance, **When** they rerecord, **Then** the previous feedback history remains viewable so they can compare attempts before advancing.

---

### User Story 2 - Scenario Studio and Library (Priority: P2)

Learner drafts, AI-generates, or imports text to create a role-play scenario, edits the normalized scenario card, saves it to the Scenario Library, and launches either StW or Zen mode via the Scenario Launchpad.

**Why this priority**: Personalized, goal-driven scenarios keep practice relevant and make the coaching tools reusable across contexts.

**Independent Test**: Create scenarios using each of the three sources, verify editing and normalization, confirm they appear in the library cards with metadata and search, and launch both modes via the Launchpad without needing notebook or training systems.

**Acceptance Scenarios**:

1. **Given** the learner selects AI Generate and enters a keyword, **When** the scenario is produced, **Then** it is normalized into a structured card (description, roles, main/sub goals) editable before acceptance.
2. **Given** the learner imports external text, **When** the system extracts context, **Then** the resulting scenario displays inferred roles/goals and clearly marks information derived from the source for confirmation.
3. **Given** a saved scenario card in the library, **When** the learner opens the Launchpad, **Then** they see scenario details on the left and explicit mode options (StW or Zen) on the right before starting.

---

### User Story 3 - Zen Mode Immersive Conversation (Priority: P3)

Intermediate learner launches Zen Mode from the Launchpad, speaks in real time with a minimalist interface, optional transcript, and animated agent, then receives a post-session Evaluation Report summarizing pronunciation issues, grammar problems, unnatural expressions, and extracted learning items that can be saved.

**Why this priority**: Zen Mode provides the fluent, low-friction experience that tests readiness beyond structured coaching while still feeding the learning loop with actionable insights.

**Independent Test**: Run a Zen session, observe live indicators (listening/thinking/speaking), ensure transcript toggling works, and verify that the Evaluation Report surfaces categorized feedback and save-to-notebook shortcuts without interacting with StW or training modules.

**Acceptance Scenarios**:

1. **Given** Zen Mode is active, **When** the learner speaks, **Then** the agent animation reflects listening/thinking/speaking states and confirms turn-taking without needing manual pauses.
2. **Given** the learner collapses the transcript mid-session, **When** they reopen it, **Then** the full transcript (with speaker attribution) is restored without losing earlier turns.
3. **Given** a session ends, **When** the Evaluation Report appears, **Then** it lists pronunciation, grammar, naturalness issues, and extracted expressions with one-click save actions that route to the Notebook.

---

### User Story 4 - Notebook, Review, and Guided Training (Priority: P4)

Learner saves expressions from any feature, manages them in a universal notebook format, completes daily spaced-repetition reviews, and runs guided training sessions where each saved item is drilled with all exercise types (answer generation, ask-a-question, translation, read-aloud/shadowing) followed by Again/Hard/Good/Easy ratings that reschedule the next review.

**Why this priority**: The notebook and SRS-driven training loop convert discoveries into long-term retention, ensuring the Practice → Evaluate → Extract → Save → Review → Reuse cycle remains intact.

**Independent Test**: Save expressions manually, review notebook item fields, trigger a daily review queue, finish a guided training session across all exercise types, and verify scheduling changes independent of conversation modes.

**Acceptance Scenarios**:

1. **Given** a saved expression, **When** the learner opens it in the notebook, **Then** they can edit phrase, meaning, usage notes, variants, example sentences, context sentence, IPA, and spoken-English notes in one normalized card.
2. **Given** the daily review queue is generated, **When** the learner starts review, **Then** the system presents each learning item with at least one of every exercise type before surfacing rating buttons that reschedule the item.
3. **Given** the learner completes a guided session, **When** they rate an item as Again/Hard/Good/Easy, **Then** the system stores the outcome, updates the next due date, and shows a confirmation summary for that card.

---

### User Story 5 - Expression Discovery and Quick Entry Points (Priority: P5)

Learner visits the Ask page, requests “How do I express X?”, receives multiple tone-specific sentences, reviews extracted preview cards, saves chosen expressions, and from the Home dashboard they can jump into ad-hoc training (enter text to auto-generate cards), resume scenarios, or see review obligations.

**Why this priority**: Expression discovery and a central dashboard keep users inspired between sessions, reduce friction when they lack ideas, and ensure they always know the next best action.

**Independent Test**: Submit prompts on the Ask page, inspect tone variations and preview cards, save items to the notebook, and launch Quick Training plus Today’s Reviews directly from the Home dashboard without touching other modules.

**Acceptance Scenarios**:

1. **Given** a user asks “How do I decline politely?”, **When** the Ask page responds, **Then** it returns at least two tone variants, highlights key expressions as preview cards, and lets the learner save selected items.
2. **Given** the learner lands on Home with pending reviews, **When** they tap Today’s review tasks, **Then** they jump directly into the SRS queue without reselecting a scenario.
3. **Given** the learner enters custom text into Quick Training, **When** the system processes it, **Then** it extracts items, creates instant training cards, and routes them through the same exercise + rating pattern as standard reviews.

---

### Edge Cases

- Microphone permissions are denied or revoked mid-session; the system must pause recording, surface recovery guidance, and prevent empty bubbles from progressing.
- AI scenario generation fails or returns incomplete roles/goals; the Studio must keep draft inputs, highlight missing data, and offer retry/regenerate options.
- User loses connectivity during a Zen session; the UI should indicate reconnection status and preserve transcript locally until syncing resumes.
- Notebook or SRS queues are empty; Home should show a celebratory state plus options (Ask page, Scenario Studio) instead of blank screens.
- Duplicate expressions are saved from different sources; the Notebook must detect potential duplicates and prompt the learner before creating redundant cards.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide at least one default scenario so new learners can launch a Stop-the-World session without prior setup.
- **FR-002**: Stop-the-World conversations MUST display bubble-based transcripts with keyboard navigation (J/K) and keep only one active bubble that controls copilot content.
- **FR-003**: Copilot panel MUST support Inspiration Burst and Distill modes for AI bubbles, each returning suggestions with meanings, notes, example sentences, and save-to-notebook actions.

**Copilot Structured Notes (StW Distill/Inspiration)**

- Output format is a JSON array of notebook-ready notes. Each item:
  - `content`: phrase/idiom/collocation (avoid isolated single words; target B1+ learners).
  - `explanation`: `{ en: string, zh: string }` (bilingual gloss).
  - `examples`: 2–3 spoken-English sample sentences; for Inspiration, the first example must be a sentence the learner can say next in the current dialogue.
- Distill: derive 0–N notes from the selected AI bubble; skip trivial vocabulary.
- Inspiration: consider the full conversation history up to the active bubble and suggest next-turn ideas in the same format.
- UI: show content + first example by default; reveal full explanation/examples on hover; each note has its own “Save to Notebook” control and uses a subtle background (no harsh contrast with its container).
- **FR-004**: User bubbles MUST pass through a pre-send evaluation that surfaces pronunciation issues (with reference audio), grammar problems, and naturalness suggestions before Send becomes available.
- **FR-005**: System MUST allow unlimited retries on pending user bubbles and retain a visible history of previous feedback for comparison.
- **FR-006**: Conversation flow MUST enforce the defined state machine (Idle -> Recording -> Pending -> Evaluating -> Ready to Send -> Sent) and prevent jumps that would skip evaluation.
- **FR-007**: Scenario Studio MUST support Manual Draft, AI Generate, and Import Text inputs, normalize outputs into editable cards, and preserve drafts until the learner accepts or discards them.
- **FR-008**: Scenario Library MUST index saved scenarios with emoji/thumbnail, title, role summary, main goal, last practiced time, card menu actions (Edit, View, Delete), and search/filter capabilities.
- **FR-009**: Scenario Launchpad MUST show scenario overview and allow explicit mode selection (StW or Zen) before launching.
- **FR-010**: Zen Mode MUST provide minimalist visuals with animated agent states, optional transcript toggling, uninterrupted real-time audio exchange, and the ability to end sessions gracefully.
- **FR-011**: After Zen Mode ends, the system MUST generate a Session Evaluation Report listing pronunciation, grammar, unnatural expression findings, plus extracted learning items with save actions.
- **FR-012**: Notebook MUST store each expression in the universal format (phrase, meaning, usage notes, variants, example sentences, context sentence, IPA, spoken-English notes) and allow edits plus localization between English and Chinese.
- **FR-013**: Saving expressions from Inspiration Burst, Distill, Zen reports, Ask page, and Quick Training MUST converge into the same Notebook pipeline without duplicating data silently.
- **FR-014**: Spaced-repetition engine MUST create daily review queues per learner using an Anki-like forgetting curve and generate guided sessions that include all four exercise types before rating.
- **FR-015**: Training sessions MUST collect Again/Hard/Good/Easy ratings for each item and immediately reschedule the next review date while displaying confirmation to the learner.
- **FR-016**: Ask page MUST accept meaning-based prompts, return 2–3 tone variants, extract expressions as preview cards, and let learners save or discard them individually.
- **FR-017**: Home dashboard MUST summarize today’s review tasks, quick actions (Create/Resume Scenario, Ask page, Quick training, Continue last scenario), and show completion stats without overwhelming novice learners.
- **FR-018**: The system MUST provide localization hooks so UI labels, coaching text, and notebook metadata can be rendered in English and Chinese with room for future locales.
- **FR-019**: All user-generated recordings, notes, and saved expressions MUST be stored securely with clear retention intents and respect environment-provided tokens for any third-party speech services.

### Key Entities *(include if feature involves data)*

- **Scenario Template**: Represents a practice context with fields for title, emoji/thumbnail, description, learner role, AI role, main goal, sub goals, and provenance (manual, AI, import). Links to scenario history (last practiced time, preferred mode).
- **Conversation Session**: Captures a single StW or Zen session, referencing the scenario, mode, timestamps, transcript, bubble states, evaluation outputs, and saved learning items.
- **Conversation Bubble**: Individual turn within a session containing speaker type (AI/User), state machine status, associated coaching insights (Inspiration Burst/Distill/evaluation), and pending/confirmed status.
- **Notebook Item**: Canonical learning card with phrase, meaning, usage notes, variants, example sentences, context sentence, IPA, spoken-English notes, source reference, and localization fields.
- **Review Task / Training Card**: Instance of a notebook item scheduled for spaced repetition, storing next due date, exercise history, rating outcomes, and difficulty multipliers.
- **Expression Suggestion**: Temporary object generated by Ask page, Inspiration Burst, Distill, or Zen report before it becomes a Notebook Item; tracks origin, tone, and whether it was saved.
- **Session Evaluation Report**: Summary artifact produced after StW evaluations or Zen sessions that groups pronunciation, grammar, naturalness findings, and extracted expressions for export to the notebook.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of first-time learners complete a Guided Stop-the-World turn (record -> feedback -> send) within 5 minutes of entering the feature.
- **SC-002**: At least 75% of active weekly users save two or more expressions per week via Inspiration Burst, Distill, Zen reports, or the Ask page.
- **SC-003**: Session Evaluation Reports appear within 60 seconds of ending a Zen session for 95% of conversations shorter than 20 minutes.
- **SC-004**: 65% of learners who start a daily review session finish the entire queue, with total review time under 10 minutes for the median user.
- **SC-005**: 80% of survey respondents report increased speaking confidence after completing three combined StW or Zen sessions plus one review loop.

## Assumptions & Dependencies

- Existing authentication, profile management, and payment systems are already in place; this feature plugs into authenticated learner accounts.
- Learners grant microphone access; fallback copy instructs them how to enable permissions if initially denied.
- Third-party speech recognition, pronunciation scoring, and TTS services are available via environment-provided tokens and comply with data security requirements.
- Default template scenarios ship with the product so new users can practice immediately even before creating custom content.
- Analytics instrumentation will track confidence surveys, saved expressions, review completion, and scenario usage to evaluate success criteria.
