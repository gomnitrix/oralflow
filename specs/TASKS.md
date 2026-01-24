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
| Scenario Studio | 5 | 0 | 3 | 0 |
| Zen Mode | 3 | 3 | 0 | 3 |
| Notebook | 3 | 0 | 2 | 6 |
| Training & Review | 0 | 0 | 2 | 6 |
| Ask & Dashboard | 7 | 1 | 2 | 5 |
| Free Chat | 4 | 1 | 1 | 5 |
| Profile & Personalization | 0 | 0 | 0 | 3 |
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
- [x] Scenario Studio normalization (manual/AI/import) - partial
- [x] Scenario Studio UI - needs layout and UX improvements
  - [x] Move "AI Generate" tab to first position (before "Manual Draft")
  - [x] Remove backfill-to-form logic: clicking Edit on generated card should enable in-place editing within the card itself, NOT populate the Manual Draft form
    - [x] **Fix insufficient padding in editable textarea fields**: Main Goal and Sub Goals textarea elements have inadequate internal spacing (`px-3 py-2`), causing text content to collide with border edges (particularly top-left corner). **Root cause**: Insufficient vertical (padding-top) and horizontal (padding-left) padding results in visual text overflow and poor alignment. **Solution**: Increase textarea padding from `px-3 py-2` to `px-4 py-3` to match title input field spacing and ensure consistent form control padding across the component. **Location**: `src/components/scenario/studio/StudioPreviewCard.tsx` lines 139 (Main Goal) and 156 (Sub Goals) 
  - [x] Reduce generated card width (currently takes too much space), give more width to left input area
  - [x] In Characters section: rename "Other:" label to "AI Role:"
  - [x] Make "Your Role:" and "AI Role:" labels non-editable (styled like "Main Goal" label), only the content values should be editable
  - [x] Investigate what the AI-generated descriptive phrase under Characters is in code; if not functional, make it non-editable as well

### Zen Mode
- [x] Realtime handler scaffolding
- [x] Zen UI shell (HUD, transcript toggle, animations)
- [x] Session transcript persistence

### Notebook
- [x] Notebook service with normalized cards
- [x] `/api/notes/items` endpoint
- [x] Notebook UI basic list with edit/delete
- [x] Notebook item editing experience needs refinement
  - [x] **Fix non-functional edit button**: Edit button on notebook item cards does not trigger any action when clicked. Need to implement edit functionality to allow users to modify saved notebook items in-place or via modal.
  - [x] **Add TTS pronunciation button**: Add an audio icon button next to each phrase that reads out the phrase when clicked. This requires TTS integration and a corresponding model configuration entry in the model settings page for TTS capability assignment.
  - [x] **Configure TTS model assignment UI**: Add TTS model selection and configuration interface in the `/models` page to support phrase pronunciation feature in Notebook.

### Ask & Dashboard
- [x] Ask service with tone-tagged suggestions
- [x] `/api/ask` endpoint
- [x] Home dashboard with quick actions
- [x] Celebratory empty states on Home
- [x] **Fix content format - use concise phrases not full sentences**: AI-generated note content should be short phrases (e.g., "decline politely", "express gratitude"), NOT complete sentences. Adjust AI prompt to instruct the model to generate brief, natural phrase entries suitable for Notebook items.
- [x] **Fix "Missing named parameter 'locale'" error on save**: When saving notes from Ask page, the API returns error "Missing named parameter 'locale'". This is likely due to missing `locale` field in the request payload or schema validation. Fix the save logic in `/api/ask/save` route or update the `expressionSuggestionSchema` to properly handle locale defaults.
- [x] **Remove or clarify "neutral" tone display**: Expression preview cards display a "neutral" label (likely from `suggestion.tone` field) on the right side. If this field is not meaningful or useful for users, remove it from both AI generation logic and the UI display in `ExpressionPreview` component. If keeping it, ensure all tone values are user-friendly and documented.

### Free Chat
- [x] Fix context generation logic: regardless of user input language, `englishContext` must ALWAYS be AI-processed English - processing includes: removing redundant info, cleaning up colloquial/meaningless content, translation if needed. Remove any existing logic that just passes through raw input
- [x] Fix summary generation: must be ≤8 words, expressing complete meaning (NOT a crude truncation of the full context). AI should generate a proper semantic summary
- [x] Disable "Start in StW/Zen" buttons until "Prepare with AI" completes successfully
- [x] **Fix incorrect context badge display in conversation header**: In StopTheWorldShell conversation page header, the context info badge displays `freeContext.snippet` (truncated `englishContext`), but should display `freeContext.summary` as the default visible text. **Root cause**: Wrong property reference in conditional rendering - using `snippet` instead of `summary` for the badge's text content. **Current behavior**: Shows truncated raw context (e.g., "I'm planning to visit Paris next month and need to...") with additional truncation via `max-w-[320px]`. **Expected behavior**: Display concise AI-generated summary (e.g., "Planning Paris trip") as the badge text, with full context shown on hover tooltip (this part is working correctly). **Solution**: Change line 940 from `{freeContext.snippet}` to `{freeContext.summary}` to display the semantic summary instead of the truncated raw text. **Location**: `src/components/conversation/stw/StopTheWorldShell.tsx` line 940

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

## Partial / Needs Work [~]

### Scenario Studio
- [~] Integration tests for scenario flows - basic coverage

### Notebook
- [~] Notebook card details need polish and field completion

### Training & Review
- [-] SRS engine with Anki-like scheduling - basic implementation
- [-] `/api/training/schedule` endpoint - basic implementation

### Ask Page
- [x] Ask page layout needs complete redesign (current: oversized input box, "Ask" button left-aligned below textarea - looks awkward on a sparse page)
  - [x] Redesign with center-aligned layout (reference: Google homepage search box style)
  - [x] Reduce input box to appropriate size
  - [x] Reposition "Ask" button appropriately (e.g., inside input or centered below)
  - [x] Improve overall visual balance for a minimal page
  - [-] **Refine search box UI: focus state and vertical alignment**: The search textarea displays a blue focus ring when active, and the text baseline is vertically misaligned with the search icon and 'Ask' button. **Root cause**: Missing focus-state style reset and inconsistent vertical centering logic in the flex container. **Expected behavior**: No visible border or ring on focus; text perfectly centered vertically between the search icon and the 'Ask' button.
  - [-] **Display example sentences in Ask page results**: AI-generated notes from the Ask page include 3 example sentences in the data, but they are not currently displayed in the UI. **Expected behavior**: Results should show example sentences consistent with the Notebook page's card design.
  - [-] **Replace Ask sidebar icon with search icon**: The current icon for the 'Ask' item in the sidebar should be replaced with a more intuitive search icon.

### Free Chat
- [~] Free Chat page UI needs significant improvements
  - [x] Fix header: currently shows both "Free Chat" (small label) AND "Context Chat" (large title) - keep only the styled header format but change content to "Free Chat" (align with other pages' header style)
  - [x] Simplify description: current text "Paste any text as context, let AI translate/clean it, and jump into a conversation with Zen or Stop The World. Nothing is saved as a scenario." is too verbose - condense to core value proposition
  - [x] Remove input fields: Title (optional), Your Role, AI Role - keep ONLY the Context textarea
  - [x] Add Edit button (top-right) to Context Preview card
  - [x] Enable in-place editing: after clicking Edit, title/context/summary fields in preview card become editable inline
    - [-] **Refine summary input UI: focus state and border reset**: The summary input field in Free Chat displays a native black border and a blue focus ring when active, breaking the custom design. **Root cause**: Missing border and focus-state style resets. **Expected behavior**: Input should be borderless and show no focus ring, appearing seamlessly within its container.
- [-] **Conditional exit confirmation for Free Chat sessions**: When exiting a conversation started from Free Chat, the dialog currently warns "Goals not completed". Since Free Chat has no explicit goals, this message is inappropriate. **Expected behavior**: If the session is a Free Chat session (e.g., `isFreeChat` or `freeContext` is present), the exit dialog should show a generic confirmation (e.g., "Are you sure you want to exit?"). Scenario-based sessions should still show the goal-completion warning. **Location**: `src/components/conversation/stw/StopTheWorldShell.tsx` (or relevant shell component)

### Profile & Personalization
- [-] **Implement User Profile management**: Create a simple profile page or modal to manage user identity.
  - [-] **Profile UI**: Allow users to edit their `username` and select/upload an `avatar`.
  - [-] **Persistence**: Save profile data using the existing persistence layer (e.g., `user-profile.json`) to ensure it survives restarts.
  - [-] **Integration - Home Greeting**: Replace the hardcoded "Alex" in the dashboard greeting with the actual username from profile settings.
  - [-] **Integration - STW Avatar**: Use the user's chosen avatar in the Stop-the-World conversation bubbles.
  - [-] **Fix 404**: Ensure the profile link in the sidebar/header correctly routes to the new profile page or triggers the modal.

### Zen Mode
- [-] Zen orchestration service
- [-] Zen evaluation report generation
- [-] Integration tests for Zen session

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
- `src/app/(public)/page.tsx` - Home/Dashboard page
- `src/app/(public)/free-chat/page.tsx` - Free Chat
- `src/app/(public)/scenarios/create/page.tsx` - Scenario Studio
- `src/app/(public)/ask/page.tsx` - Ask page
- `src/app/(public)/notebook/page.tsx` - Notebook page
- `src/app/(public)/training/page.tsx` - Training page
- `src/app/(public)/models/page.tsx` - AI Model settings
