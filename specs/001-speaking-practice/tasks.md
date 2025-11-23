# Tasks: Oralflow Speaking Practice Loop

**Input**: Design documents from `/specs/001-speaking-practice/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Add targeted domain/unit or integration tests where explicitly called out below; E2E coverage lands in the Polish phase.
**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare environment documentation so contributors can run the feature locally.

- [X] T001 Update `.env.example` with `OPENAI_API_KEY`, `GEMINI_API_KEY`, `REALTIME_PROVIDER`, and `LOCAL_STORAGE_PATH` entries to unblock `src/services/ai/client.ts` configuration.
- [X] T002 Create `docs/setup/speaking-loop.md` that references `quickstart.md`, details env variables, and documents `npm test && npm run lint` so onboarding matches QA expectations.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish core architecture (domains, storage, AI, validation, localization, shared UI, testing, instrumentation) required by every story.

 - [X] T003 Scaffold domain module directories and barrel exports under `src/domains/{conversation,copilot,evaluation,training,scenario,notes}/index.ts` per the implementation plan.
 - [X] T004 [P] Define entity interfaces + factory helpers per `data-model.md` in `src/domains/conversation/models.ts`, `src/domains/scenario/models.ts`, `src/domains/notes/models.ts`, and `src/domains/training/models.ts`, including conversation bubble state enums.
 - [X] T005 [P] Implement the storage adapter plus repository interfaces in `src/services/persistence/storage-adapter.ts` and `src/services/persistence/repositories.ts` so sessions, scenarios, notebook items, and review tasks share persistence.
 - [X] T006 [P] Add the unified AI client with provider switch + prompt stubs in `src/services/ai/{client.ts,conversation-model.ts,evaluation-model.ts,content-model.ts}` using env config from Phase 1.
 - [X] T007 [P] Create request/response validation with Zod in `src/lib/validation/{conversation.ts,scenario.ts,notes.ts}` and share schemas across API routes.
 - [X] T008 [P] Implement localization scaffolding with English and Chinese catalogs under `src/lib/i18n/{index.ts,en.ts,zh.ts}` and wrap the App Router shell in `src/app/layout.tsx` with a translation provider.
 - [X] T009 [P] Extend `tailwind.config.ts` tokens (spacing, typography, colors) and add shared primitives in `src/components/shared/{Button.tsx,Card.tsx,TranscriptList.tsx}` for consistent UI.
 - [X] T010 [P] Configure `jest.config.ts`, `playwright.config.ts`, and baseline docs in `tests/README.md` so `npm test && npm run lint` exercises unit + integration scaffolding from the outset.
 - [X] T011 [P] Instrument SC-001–SC-005 telemetry via `src/lib/analytics/speaking-loop.ts`, wire emitters in conversation/zen/training/ask flows, and document the event schema in `docs/analytics/speaking-loop.md`.

---

## Phase 3: User Story 1 - Guided Stop-the-World Session (Priority: P1) 🎯 MVP

**Goal**: Deliver the Stop-the-World coaching loop with bubble transcript, evaluation gating, copilot assistance, and notebook saves so hesitant learners can practice deliberately.

**Independent Test**: Start a default StW session, record two utterances, observe pronunciation/grammar/naturalness feedback history, trigger Inspiration Burst + Distill, save a suggestion, and send the bubble without touching other features.

### Implementation

 - [X] T012 [P] [US1] Implement the Stop-the-World state machine + orchestration logic enforcing `idle → recording → pending → evaluating → readyToSend → sent` in `src/domains/conversation/stw-service.ts`.
 - [X] T013 [P] [US1] Build pronunciation/grammar/naturalness evaluators plus report mappers in `src/domains/evaluation/{pronunciation-service.ts,grammar-service.ts,report-builder.ts}` to feed gating.
 - [X] T014 [P] [US1] Implement Inspiration Burst + Distill services with notebook gateway hooks in `src/domains/copilot/{inspiration-service.ts,distill-service.ts,notebook-gateway.ts}`.
 - [X] T015 [US1] Implement the `/api/conversation/stw-evaluate` route in `src/app/api/conversation/stw-evaluate/route.ts` that validates payloads, calls evaluation services, and persists results per `contracts/http-openapi.yml`.
 - [X] T016 [US1] Build the Stop-the-World shell UI (scenario loader, bubble list, retry controls, send gating) in `src/app/(public)/stw/page.tsx` and `src/components/conversation/stw/StopTheWorldShell.tsx`.
 - [X] T017 [US1] Create the copilot panel UI with Inspiration/Distill tabs, copy, reference audio, and save CTA in `src/components/copilot/{Panel.tsx,BurstCard.tsx,DistillCard.tsx}`.
 - [X] T018 [US1] Wire save-to-notebook actions for copilot suggestions via `src/domains/notes/notebook-service.ts` and `src/app/api/notes/items/route.ts`, including duplicate detection + confirmation copy.
 - [X] T019 [US1] Seed at least one default scenario in `src/services/persistence/seeds/scenarios.ts` and preload it in `src/app/(public)/stw/page.tsx` so learners can launch without setup.
 - [X] T020 [P] [US1] Add unit tests for the conversation state machine + retry/evaluation gating in `tests/unit/domains/conversation/stw-service.test.ts`.
 - [X] T021 [US1] Implement keyboard navigation (J/K) and enforce a single copilot-controlled active bubble in `src/components/conversation/stw/StopTheWorldShell.tsx`, updating focus rings + state sync.
 - [X] T022 [P] [US1] Add component tests covering keyboard navigation + copilot focus behavior in `tests/unit/components/conversation/StopTheWorldShell.test.tsx`.

---

## Phase 4: User Story 2 - Scenario Studio and Library (Priority: P2)

**Goal**: Allow learners to draft, AI-generate, or import scenarios, normalize them into editable cards, manage the library, and launch StW or Zen via a Launchpad.

**Independent Test**: Create scenarios via manual, AI, and import flows; edit normalization fields; ensure cards appear in the library with metadata; and launch both modes via the Launchpad without Notebook or training features.

### Implementation

 - [X] T023 [P] [US2] Implement Scenario Studio normalization flows (manual draft, AI generate, import text with provenance flags) in `src/domains/scenario/studio-service.ts`.
 - [X] T024 [P] [US2] Implement Scenario Library search/filter/CRUD + last-practiced tracking in `src/domains/scenario/library-service.ts` backed by repositories.
 - [X] T025 [US2] Build `/api/scenarios/generate` and `/api/scenarios/crud` handlers in `src/app/api/scenarios/{generate,crud}/route.ts` with validation + persistence per `contracts/http-openapi.yml`.
 - [X] T026 [US2] Create the Scenario Studio UI (mode selector, AI progress indicator, import annotations) in `src/app/(public)/scenarios/create/page.tsx` and `src/components/scenario/StudioForm.tsx`.
 - [X] T027 [US2] Build the Scenario Library grid + card menus + Launchpad modal in `src/app/(public)/scenarios/page.tsx` and `src/components/scenario/{ScenarioCard.tsx,ScenarioLaunchpad.tsx}`.
 - [X] T028 [US2] Wire Launchpad actions to StW/Zen routes with scenario context via `src/lib/navigation/launchpad.ts` and ensure Home/Scenario pages honor the preferred mode field.
 - [X] T029 [P] [US2] Add integration coverage for create/edit/list/launch journeys in `tests/integration/scenario/studio-library.test.ts`.

---

## Phase 5: User Story 3 - Zen Mode Immersive Conversation (Priority: P3)

**Goal**: Deliver realtime Zen sessions with streaming UI, transcript controls, agent animation, and a post-session evaluation report with notebook-ready extractions.

**Independent Test**: Launch Zen Mode, speak through a short conversation, toggle the transcript, observe realtime agent states, end the session, and read the evaluation report with save actions—without touching StW or training screens.

### Implementation

 - [X] T030 [P] [US3] Implement Zen orchestration (connection lifecycle, transcript buffering, notebook linkage) in `src/domains/conversation/zen-service.ts` following `contracts/realtime-zen.md`.
 - [X] T031 [P] [US3] Build the realtime handler at `src/app/realtime/zen/route.ts` that bridges provider-specific events to domain events (audio chunks, session state, errors).
 - [X] T032 [US3] Create the Zen UI shell with minimalist HUD, transcript toggle, agent animation, and end-session controls in `src/app/(public)/zen/page.tsx` and `src/components/conversation/zen/ZenShell.tsx`.
 - [X] T033 [US3] Implement Zen evaluation report generation plus API handler in `src/domains/evaluation/report-builder.ts` (Zen summary branch) and `src/app/api/reports/zen/route.ts`.
 - [X] T034 [US3] Persist Zen session transcripts + states in `src/services/persistence/repositories.ts` and expose summary downloads + notebook save shortcuts in `src/components/conversation/zen/ZenReportPanel.tsx`.
 - [X] T035 [P] [US3] Add integration tests for realtime transcript toggling + report generation in `tests/integration/zen/zen-session.test.ts`.

---

## Phase 6: User Story 4 - Notebook, Review, and Guided Training (Priority: P4)

**Goal**: Provide the universal notebook format, spaced-repetition review queues, guided multi-exercise training sessions, and Again/Hard/Good/Easy scheduling.

**Independent Test**: Manually save expressions, edit full notebook cards, start today’s review queue, complete all exercise types in a guided session, and confirm ratings reschedule items without relying on conversation modes.

### Implementation

 - [X] T036 [P] [US4] Expand the notebook service with normalized card fields, dedupe logic, and localization metadata in `src/domains/notes/notebook-service.ts` plus entity helpers in `src/domains/notes/models.ts`.
 - [X] T037 [P] [US4] Implement the SRS engine, session builder, and rating formulas in `src/domains/training/{srs-engine.ts,session-builder.ts,rating-service.ts}` based on ReviewTask fields.
 - [X] T038 [US4] Build `/api/notes/items` list/update/delete features and `/api/training/schedule` queue generation in `src/app/api/{notes/items,training/schedule}/route.ts` with validation + persistence hooks.
 - [X] T039 [US4] Create the Notebook UI with normalized card edit, duplicate prompts, and localization toggle in `src/app/(public)/notebook/page.tsx` and `src/components/notebook/NotebookCard.tsx`.
 - [X] T040 [US4] Build the Training/Review page with exercise carousel + voice/text prompts in `src/app/(public)/training/page.tsx` and `src/components/training/ReviewSession.tsx`.
 - [X] T041 [US4] Wire Again/Hard/Good/Easy actions to session summary + schedule updates in `src/domains/training/rating-service.ts` and `src/components/training/RatingControls.tsx`.
 - [X] T042 [P] [US4] Add unit tests for the SRS scheduler and rating adjustments in `tests/unit/domains/training/srs-engine.test.ts`.
 - [X] T043 [US4] Implement celebratory empty states when notebook lists or review queues are empty in `src/app/(public)/{notebook,training}/page.tsx`, surfacing Ask/Scenario shortcuts per edge cases.

---

## Phase 7: User Story 5 - Expression Discovery and Quick Entry Points (Priority: P5)

**Goal**: Enable expression discovery via the Ask page, saving preview cards, and launching Quick Training or pending reviews from the Home dashboard.

**Independent Test**: Submit Ask prompts, review tone-specific cards, save selections, run Quick Training from Home with custom text, and jump into Today’s Reviews from the dashboard without other modules.

### Implementation

 - [X] T044 [P] [US5] Implement the Ask service that calls the content model, extracts tone-tagged `ExpressionSuggestion`s, and dedupes entries in `src/domains/notes/ask-service.ts`.
 - [X] T045 [US5] Build the `/api/ask` handler in `src/app/api/ask/route.ts` with validation + notebook save hooks per `contracts/http-openapi.yml`.
 - [X] T046 [US5] Create the Ask page UI (prompt form, tone tabs, preview cards, save buttons) in `src/app/(public)/ask/page.tsx` and `src/components/ask/ExpressionPreview.tsx`.
 - [X] T047 [US5] Enhance the Home dashboard at `src/app/(public)/page.tsx` with scenario shortcuts, Today’s Reviews count, Quick Training entry, and last session resume tiles.
 - [X] T048 [US5] Implement Quick Training ingestion that turns custom text into notebook items + ad-hoc sessions via `src/domains/training/session-builder.ts` helpers and `src/app/(public)/page.tsx` actions.
 - [X] T049 [P] [US5] Add integration tests covering Ask + Quick Training → Notebook/Training pipelines in `tests/integration/ask-dashboard.test.ts`.
 - [X] T050 [US5] Add celebratory Home dashboard empty states for zero reviews or scenarios in `src/app/(public)/page.tsx`, linking prominently to Ask and Scenario Studio per edge-case guidance.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Harden edge cases, localization, documentation, and full E2E coverage once all stories are functional.

 - [X] T051 [P] Implement microphone denial, AI failure, and offline recovery states across StW + Zen components in `src/components/conversation/{stw/StopTheWorldShell.tsx,zen/ZenShell.tsx}` and input validation in `src/components/scenario/StudioForm.tsx`.
 - [X] T052 [P] Expand language catalogs with finalized English/Chinese copy for Notebook, Training, Ask, and Dashboard flows in `src/lib/i18n/{en.ts,zh.ts}` and ensure components consume the keys.
 - [X] T053 [P] Build Playwright E2E specs mirroring Quickstart scenarios in `tests/e2e/{stw-flow.spec.ts,zen-flow.spec.ts,training-review-flow.spec.ts,ask-notebook-flow.spec.ts}` and wire them into CI.
 - [X] T054 Create `docs/release/001-speaking-practice.md` documenting the QA checklist plus the required `npm test && npm run lint` verification before release.

---

## Dependencies & Execution Order

1. **Phase 1 → Phase 2**: Environment + documentation (T001–T002) must land before foundational architecture.
2. **Phase 2 → User Stories**: Domain scaffolding, storage, AI, validation, localization, shared UI, analytics, and test harness (T003–T011) unblock all user stories.
3. **Story Order**: US1 (P1) → US2 (P2) → US3 (P3) → US4 (P4) → US5 (P5). Later stories leverage prior infrastructure but each remains independently testable via their scenarios.
4. **Polish**: After all desired stories, run Polish tasks (T051–T054) for cross-cutting resilience and documentation.

## Parallel Execution Examples

- **US1**: T012–T014 can run in parallel (state machine, evaluation services, copilot services) before UI tasks T016–T018, while T021–T022 handle keyboard accessibility.
- **US2**: T023 + T024 can run concurrently while another contributor tackles API/UI tasks T025–T027.
- **US3**: T030 + T031 (domain + realtime handler) can proceed together while T032 builds UI; T033 + T034 handle reports/persistence afterward.
- **US4**: T036 + T037 run in parallel to define notebook and SRS engines, then T039–T041 focus on UI + rating flows while T043 handles empty states.
- **US5**: T044 (Ask service) and T048 (Quick Training ingestion) can progress simultaneously while T045–T047 wire API/UI, and T050 owns the celebratory Home state.

## Implementation Strategy

1. **MVP First**: Complete Phases 1–3 (Setup, Foundational, US1) to unlock the core Stop-the-World coaching loop, then validate via the US1 independent test.
2. **Incremental Delivery**: Layer US2–US5 sequentially, shipping each after its independent test passes so learners gain Scenario Studio, Zen Mode, Notebook/Training, and Ask/Dashboard upgrades incrementally.
3. **Parallel Staffing**: After Phase 2, assign separate owners per story using the parallel examples above; converge in the Polish phase for QA + localization + documentation.
4. **Quality Gates**: Before merging each story, ensure related unit/integration tests (e.g., T020, T029, T035, T042, T049) run via `npm test`, and finish with the Polish E2E suite plus documented release checklist (T053–T054).
