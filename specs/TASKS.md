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
> **Auto-commit & Push**: After verifying changes, automatically commit and push using conventional commit format.

---

## Summary

| Category | Verified | Implemented | Partial | Pending |
|----------|----------|-------------|---------|---------|
| Infrastructure | 9 | 0 | 0 | 0 |
| StW Mode | 8 | 3 | 0 | 1 |
| Scenario Studio | 6 | 0 | 3 | 0 |
| Zen Mode | 3 | 3 | 0 | 4 |
| Notebook | 4 | 0 | 2 | 7 |
| Training & Review | 0 | 0 | 2 | 6 |
| Ask & Dashboard | 11 | 0 | 2 | 5 |
| Free Chat | 5 | 1 | 1 | 5 |
| Profile & Personalization | 4 | 0 | 1 | 2 |
| AI & Infrastructure | 1 | 0 | 0 | 1 |
| Additional Features | 8 | 1 | 0 | 0 |

---

## Verified ✅

### Conversation Shell
- [x] **Implement session exit protection for sidebar navigation**: Sidebar navigation now triggers a confirmation dialog during active sessions.

### Notebook
- [x] **Optimize TTS experience**:
  - [x] **Audio caching**: In-memory caching implemented.
  - [x] **Loading state UI**: Visual feedback added during TTS requests.

### Ask Page
- [x] **Add edit functionality**: Edit icon added to generated notes.

### Free Chat
- [x] Fix header: Styled header format with "Free Chat" content.
- [x] Simplify description: Condensed core value proposition.
- [x] Remove input fields: Only Context textarea remains.
- [x] Add Edit button to Context Preview card.
- [x] Enable in-place editing for preview card fields.
- [x] **Refine summary input UI: focus state and border reset**: Summary input is now borderless and ring-less on focus.

### Profile & Personalization
- [x] **Integration - Home Greeting**: Username from profile settings integrated.
- [x] **Fix Home Greeting flicker**: Flicker resolved by proper initial state handling.
- [x] **Fix sidebar profile avatar**: Sidebar avatar now updates correctly.

### AI & Infrastructure
- [x] **Implement STW Response Mode selection**: Added setting for sequential vs native audio response modes.
  - [x] Add "Audio Model" configuration in the `/models` settings page.
  - [x] Ensure both modes receive identical conversation context.
  - [x] Update STW orchestration logic to respect the selected mode.

### Ask Page
- [x] **Enhance Ask page result interaction**:
  - [x] **Add toast notification for save**: Replaced static message with a floating toast notification.

---

## Partial / Needs Work [~]

### Conversation Shell

### Scenario Studio
- [~] Integration tests for scenario flows - basic coverage

### Notebook
- [~] Notebook card details need polish and field completion

### Training & Review
- [-] SRS engine with Anki-like scheduling - basic implementation
- [-] `/api/training/schedule` endpoint - basic implementation

### Ask Page

### Free Chat

### Profile & Personalization
- [-] **Integration - STW Avatar**: Use the user's chosen avatar in the Stop-the-World conversation bubbles.

### Zen Mode
- [-] Zen orchestration service
- [-] Zen evaluation report generation
- [-] Integration tests for Zen session

### AI & Infrastructure
- [-] **Optimize Models Configuration UI**: Group STW models by mode/purpose using subheadings.
  - [-] **Sequential**: Chat Model, Text-to-Speech.
    - [x] Add info icon with tooltip: "Workflow: Text Chat -> TTS. Balanced cost and performance."
  - [-] **Native**: Audio Model.
    - [x] Add info icon with tooltip: "Workflow: End-to-end Audio. Faster response time, slightly higher cost than Sequential."
  - [-] **Other**: Speech-to-Text, Assessment (Text Analysis), Goal Completion.
  - [-] Ensure subheading style is distinct from main section titles.


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
