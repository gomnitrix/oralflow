# OralFlow Implementation Tasks

**Last Updated**: 2026-01-24  
**Status**: ~70% Complete

---

## Legend

- [x] Completed (verified by maintainer)
- [-] Implemented (pending verification)
- [~] Partial / Needs work
- [ ] Not started

> **Important**: Only the maintainer can mark tasks as `[x]` completed after verification.  
> AI/developers should mark completed work as `[-]` (implemented, pending verification).

---

## Summary

| Category | Verified | Implemented | Partial | Pending |
|----------|----------|-------------|---------|---------|
| Infrastructure | 9 | 0 | 0 | 0 |
| StW Mode | 8 | 3 | 0 | 0 |
| Scenario Studio | 4 | 0 | 3 | 0 |
| Zen Mode | 3 | 3 | 0 | 3 |
| Notebook | 3 | 0 | 2 | 3 |
| Training & Review | 0 | 0 | 2 | 6 |
| Ask & Dashboard | 4 | 1 | 2 | 0 |
| Free Chat | 0 | 1 | 1 | 5 |
| Additional Features | 8 | 1 | 0 | 0 |

---

## Verified ✅

### Infrastructure
- [x] Next.js App Router setup with TypeScript strict mode
- [x] Domain module scaffolding (`src/domains/`)
- [x] Entity interfaces and factory helpers
- [x] Storage adapter + repository pattern (SQLite + JSON fallback)
- [x] Unified AI client with multi-provider support
- [x] Zod validation schemas
- [x] i18n scaffolding (en/zh)
- [x] Tailwind design system with custom tokens
- [x] Jest + Playwright test setup

### Stop-the-World Mode
- [x] Conversation state machine (idle → recording → pending → evaluating → readyToSend → sent)
- [x] `/api/conversation/stw-evaluate` endpoint
- [x] StW shell UI with bubble list and controls
- [x] Copilot panel UI (Inspiration/Distill tabs)
- [x] Default seed scenario
- [x] Unit tests for state machine
- [x] Keyboard navigation (J/K)
- [x] Component tests for StW shell

### Scenario Studio & Library
- [x] Scenario Library CRUD + search
- [x] `/api/scenarios/generate` and `/api/scenarios/crud` endpoints
- [x] Scenario Library grid + Launchpad modal
- [x] Launch actions to StW/Zen routes

### Zen Mode
- [x] Realtime handler scaffolding
- [x] Zen UI shell (HUD, transcript toggle, animations)
- [x] Session transcript persistence

### Notebook
- [x] Notebook service with normalized cards
- [x] `/api/notes/items` endpoint
- [x] Notebook UI basic list with edit/delete

### Ask & Dashboard
- [x] Ask service with tone-tagged suggestions
- [x] `/api/ask` endpoint
- [x] Home dashboard with quick actions
- [x] Celebratory empty states on Home

### Additional Features
- [x] ProviderManager for multi-provider support
- [x] SettingsService for model assignments
- [x] `/api/ai/settings` and `/api/ai/providers` endpoints
- [x] Models page with provider status
- [x] Settings persistence (`ai-settings.json`)
- [x] StructuredNote model for Copilot output
- [x] Azure Speech SDK integration
- [x] Phoneme/word/fulltext granularity options

---

## Implemented (Pending Verification) [-]

### Stop-the-World Mode
- [-] Pronunciation/grammar/naturalness evaluators
- [-] Inspiration Burst + Distill services
- [-] Save-to-notebook from Copilot

### Ask & Dashboard
- [-] Ask page UI with preview cards (layout needs redesign)

### Free Chat
- [-] `/api/free-chat/draft` endpoint

### Additional Features
- [-] Word-level pronunciation scores in UI

---

## Partial / Needs Work [~]

### Scenario Studio
- [-] Scenario Studio UI - needs layout and UX improvements
  - [-] Move "AI Generate" tab to first position (before "Manual Draft")
  - [-] Remove backfill-to-form logic: clicking Edit on generated card should enable in-place editing within the card itself, NOT populate the Manual Draft form
  - [-] Reduce generated card width (currently takes too much space), give more width to left input area
  - [-] In Characters section: rename "Other:" label to "AI Role:"
  - [-] Make "Your Role:" and "AI Role:" labels non-editable (styled like "Main Goal" label), only the content values should be editable
  - [-] Investigate what the AI-generated descriptive phrase under Characters is in code; if not functional, make it non-editable as well
- [~] Scenario Studio normalization (manual/AI/import) - partial
- [~] Integration tests for scenario flows - basic coverage

### Notebook
- [~] Notebook card details need polish and field completion
- [~] Notebook item editing experience needs refinement

### Training & Review
- [ ] SRS engine with Anki-like scheduling - basic implementation
- [ ] `/api/training/schedule` endpoint - basic implementation

### Ask Page
- [-] Ask page layout needs complete redesign (current: oversized input box, "Ask" button left-aligned below textarea - looks awkward on a sparse page)
  - [-] Redesign with center-aligned layout (reference: Google homepage search box style)
  - [-] Reduce input box to appropriate size
  - [-] Reposition "Ask" button appropriately (e.g., inside input or centered below)
  - [-] Improve overall visual balance for a minimal page

### Free Chat
- [-] Free Chat page UI needs significant improvements
  - [-] Fix header: currently shows both "Free Chat" (small label) AND "Context Chat" (large title) - keep only the styled header format but change content to "Free Chat" (align with other pages' header style)
  - [-] Simplify description: current text "Paste any text as context, let AI translate/clean it, and jump into a conversation with Zen or Stop The World. Nothing is saved as a scenario." is too verbose - condense to core value proposition
  - [-] Remove input fields: Title (optional), Your Role, AI Role - keep ONLY the Context textarea
  - [-] Add Edit button (top-right) to Context Preview card
  - [-] Enable in-place editing: after clicking Edit, title/context/summary fields in preview card become editable inline
  - [-] Fix context generation logic: regardless of user input language, `englishContext` must ALWAYS be AI-processed English - processing includes: removing redundant info, cleaning up colloquial/meaningless content, translation if needed. Remove any existing logic that just passes through raw input
  - [-] Fix summary generation: must be ≤8 words, expressing complete meaning (NOT a crude truncation of the full context). AI should generate a proper semantic summary
  - [-] Disable "Start in StW/Zen" buttons until "Prepare with AI" completes successfully

### Zen Mode
- [-] Zen orchestration service
- [-] Zen evaluation report generation
- [-] Integration tests for Zen session

---

## Priority Queue

### Tier 1 - Core UX Fixes
1. **Free Chat page redesign**
   - Remove duplicate header, simplify description
   - Remove unnecessary input fields (Title, Your Role, AI Role)
   - Fix AI context generation (always process to English, clean content)
   - Fix summary to be ≤8 words semantic summary (not truncation)
   - Add in-place editing for preview card
   
2. **Ask page layout**
   - Center-aligned Google-style search box design
   - Appropriate input size and button placement
   
3. **Scenario Studio UX**
   - AI Generate tab first
   - In-place card editing (not backfill to form)
   - Non-editable role labels, narrower card width

### Tier 2 - Missing Features
4. **Training & Review** - Complete page implementation (currently non-functional)
5. **Notebook polish** - Full card fields, better editing
6. **Audio integration** - Recording, playback, visualization

### Tier 3 - Real-time & Polish
7. **Zen real-time** - WebSocket, STT, TTS
8. **E2E tests** - Full coverage
9. **Mobile & i18n** - Responsive, translations

---

## Verification Commands

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Build production
npm run build

# Run E2E tests
npx playwright test
```

---

## File References

### Key Domain Files
- `src/domains/conversation/stw-service.ts` - StW state machine
- `src/domains/conversation/zen-service.ts` - Zen orchestration
- `src/domains/copilot/distill-service.ts` - Distill logic
- `src/domains/copilot/inspiration-service.ts` - Inspiration logic
- `src/domains/evaluation/pronunciation-service.ts` - Azure Speech
- `src/domains/training/srs-engine.ts` - SRS algorithm

### Key Component Files
- `src/components/conversation/stw/StopTheWorldShell.tsx` - StW UI
- `src/components/conversation/zen/ZenShell.tsx` - Zen UI
- `src/components/copilot/Panel.tsx` - Copilot panel
- `src/components/training/ReviewSession.tsx` - Training UI

### Key Pages Needing Work
- `src/app/(public)/free-chat/page.tsx` - Free Chat
- `src/app/(public)/scenarios/create/page.tsx` - Scenario Studio
- `src/app/(public)/ask/page.tsx` - Ask page
- `src/app/(public)/training/page.tsx` - Training page
