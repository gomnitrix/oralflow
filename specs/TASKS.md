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
| Training & Review | 0 | 8 | 0 | 0 |
| Ask & Dashboard | 11 | 0 | 2 | 5 |
| Free Chat | 5 | 1 | 1 | 5 |
| Profile & Personalization | 4 | 0 | 1 | 2 |
| AI & Infrastructure | 1 | 0 | 0 | 1 |
| Additional Features | 8 | 1 | 0 | 0 |

---

## Verified ✅


---

## Partial / Needs Work [~]

### Conversation Shell

### Scenario Studio
- [~] Integration tests for scenario flows - basic coverage

### Notebook
- [~] Notebook card details need polish and field completion

### Training & Review
- [-] **Database & Schema**:
  - [-] Update `NotebookItem` schema with SRS fields (srsLevel, nextReviewAt, lastDifficulty, etc.).
  - [-] Create `ReviewCard` schema (id, notebookItemId, type, content, metadata).
  - [-] Update SQLite tables/columns to match current Training & Review schema (no JSON migration).
- [-] **Backend Services**:
  - [-] Implement SRS Scheduling Algorithm (Service) with 'Forgot' logic (1-day interval).
  - [-] Implement `CardGeneratorService` (AI) with prompt engineering for 4 card types (Hidden Cue).
    - [-] Define System Prompts for Answer Generation, Ask Question, Translation, Read Aloud.
  - [-] Implement `CardEvaluatorService` (AI) for answer assessment.
  - [-] Implement `TrainingSessionService` to orchestrate queue and card selection.
    - [-] Implement Card Quantity Logic ($N = 5 - D$).
    - [-] Implement New Card Probability Logic ($P_{new}$).
- [-] **API Endpoints**:
  - [-] `POST /api/training/session/start`: Generate queue and cards.
  - [-] `POST /api/training/card/evaluate`: Submit audio/text for evaluation.
  - [-] `POST /api/training/item/rate`: Submit SRS rating (Forgot/Hard/Good/Easy).
  - [-] `GET /api/training/audio`: Generate TTS on-demand.
- [-] **Frontend - Components**:
  - [-] Create `CardStack` layout component with "peeking" effect.
  - [-] Create `ReviewCard` component with 3D flip animation.
  - [-] Create `TrainingControlBar` (Record/Skip/Retry).
  - [-] Create `DifficultySelector` overlay with time intervals.
  - [-] Create `TrainingProgressBar` component.
  - [-] Update `Copilot` for Training mode (Distill only).
- [-] **Frontend - Pages**:
  - [-] Implement `/training` page logic (Session state machine).
  - [-] Implement `/models` configuration for Training models (Generator/Evaluator).
  - [-] Implement `/settings` configuration for:
    - [-] Read-Aloud Threshold.
    - [-] New Card Generation Probabilities (Forgot/Hard/Good/Easy).

### Ask Page

### Free Chat

### Profile & Personalization
- [-] **Integration - STW Avatar**: Use the user's chosen avatar in the Stop-the-World conversation bubbles.

### Zen Mode
- [-] Zen orchestration service
- [-] Zen evaluation report generation
- [-] Integration tests for Zen session

### AI & Infrastructure


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
- `src/components/training/TrainingSessionShell.tsx` - Training UI

### Key Pages Needing Work
- `src/app/(public)/page.tsx` - Home/Dashboard page
- `src/app/(public)/free-chat/page.tsx` - Free Chat
- `src/app/(public)/scenarios/create/page.tsx` - Scenario Studio
- `src/app/(public)/ask/page.tsx` - Ask page
- `src/app/(public)/notebook/page.tsx` - Notebook page
- `src/app/(public)/training/page.tsx` - Training page
- `src/app/(public)/models/page.tsx` - AI Model settings
