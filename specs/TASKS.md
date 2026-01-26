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
- [-] **Notebook Debugging & UI Enhancement**:
  - [-] Navigate to a new page for card viewing when clicking a notebook item (instead of expanding in-place).
  - [-] Implement a "Training Card Directory" page for each note.
  - [-] Display a list of all associated `ReviewCard` items for the selected note.
  - [-] Show full card information (Type, Cue, Answer, Metadata) in the list for debugging.
  - [-] Support "Supplemental Generation" action for individual notebook items (add cards without deleting existing ones).
  - [-] Support "Delete" action for individual training card.

### Training & Review
- [-] **Database & Schema**:
  - [-] Update `NotebookItem` schema with SRS fields (srsLevel, nextReviewAt, lastDifficulty, etc.).
  - [-] Create `ReviewCard` schema (id, notebookItemId, type, content, metadata).
  - [-] Update SQLite tables/columns to match current Training & Review schema (no JSON migration).
- [ ] **Backend Services**:
  - [ ] Implement SRS Scheduling Algorithm (Service) with 'Forgot' logic (1-day interval).
    - [ ] **Fix**: Ensure different difficulty levels result in different next-review intervals (not all 1d).
  - [-] **Auto-generate Initial Cards**: Automatically generate one card of each type (4 total) for every new note saved to the notebook.
  - [-] **Optimize Card Generation Prompts (Context vs. Task Separation)**:
    - **Requirement**: The current card generation prompts need further optimization. In the `answer_generation` and `ask_question` card types, the boundaries between the `context` and `task` fields are not clear enough. For example, a card front generated during testing:
      - **Context**: You're at a small family dinner. After dessert the children start running around and shouting, making it hard to keep things calm.
      - **Task**: Reply to a friend's comment "They're bouncing off the walls!" Agree and describe the kids using the casual phrase provided in the cue field (which means 'overly energetic' or 'hard to calm down'). Keep your reply to one natural sentence.
      - **Cue**: a bit hyper
      - *Issue*: The `task` contains information that should belong to the `context`, such as the friend's comment.
    - **Ideal Division of Responsibilities**:
      - **Context**: Responsible for providing a complete, natural, and vivid (but not excessively long) situation, containing all background information necessary for understanding and responding.
        - *Example*: "You’re at a small family dinner. After dessert the children start running around and shouting, making it hard to keep things calm. A friend says, 'They’re bouncing off the walls!' You agree and reply: ___"
      - **Task**: Responsible only for providing very brief task instructions and slight guidance on the direction of the answer, without repeating or supplementing situational details.
        - *Example*: "Describe the children using a casual phrase which means 'overly energetic' or 'hard to calm down'."
    - **Prompt Engineering Goals**:
      - **Context** = Complete situational input (what’s happening + what has been said + you are about to respond).
      - **Task** = Minimal operational instructions (what to do + how to answer)
      - Adjust `answer_generation` and `ask_question` prompts to clarify and strengthen this division without significantly increasing redundancy.
  - [x] Ensure "Supplemental Generation" logic (don't delete existing cards).
  - [-] **Fix Card Evaluator Service**:
    - [x] Remove `score` field from evaluation prompts and logic.
    - [-] Ensure Read-Aloud cards bypass AI evaluation and use cached pronunciation results.
  - [-] **Implement TrainingSessionService**:
    - [-] Orchestrate queue and card selection.
    - [-] Implement Card Quantity Logic ($N = 5 - D$).
    - [-] Implement New Card Probability Logic ($P_{new}$).
    - [-] **Lazy Generation**: Start session immediately with existing cards; generate new cards in the background.
- [-] **API Endpoints**:
  - [-] `POST /api/training/session/start`: Generate queue and cards.
  - [-] `POST /api/training/card/evaluate`: Submit audio/text for evaluation.
  - [-] `POST /api/training/item/rate`: Submit SRS rating (Forgot/Hard/Good/Easy).
  - [-] `GET /api/training/audio`: Generate TTS on-demand.
- [ ] **Frontend - Components**:
  - [ ] Create `CardStack` layout component with "peeking" effect.
  - [-] **ReviewCard Component Enhancements**:
    - [-] **Front Content**: Display `context`, `task`, and `answer` (blurred/masked). `cue` content is hollowed out from the `answer` text on the front. Remove `cue` and "Type your response" input.
    - [-] **Back Content**: Display *only* the full `answer`. Remove "your answer", "notes", etc.
    - [-] **Interaction**: Remove "Show Answer" button. Click card to reveal answer (unblur); click again to flip to back; click back to flip to front (answer remains revealed).
    - [-] **Audio**: Remove "Play Context". Add a pronunciation icon next to the answer on the back (similar to notebook page).
  - [-] **TrainingControlBar Alignment**:
    - [-] Align Record/Retry/Send logic with STW page.
    - [-] Retry and Send buttons only visible after recording is complete.
    - [-] **Evaluation Trigger**: Card evaluation only starts when the user clicks the "Send" button (not automatically after recording).
    - [-] Generic Record button (remove "Read Aloud" text).
  - [-] **DifficultySelector Logic**:
    - [-] Show only after the *last* card of a notebook item in the current session is completed or skipped.
  - [ ] Create `TrainingProgressBar` component.
  - [ ] **Copilot Integration for Training**:
    - [ ] Add Copilot area (similar to STW), default collapsed.
    - [ ] Auto-expand with animation to show Azure pronunciation scores after recording. and auto-collapse after retry or send.
    - [ ] Add "Distill" icon on card to trigger distill and expand Copilot.
    - [ ] Support manual collapse/expand.
- [-] **Frontend - Pages**:
  - [-] **Implement Training Transition Page**:
    - [-] Display summary: Note count, total card count, new vs. old card distribution.
    - [-] Add toggle: "Disable New Card Generation" (default OFF).
    - [-] "Start Training" button to enter the session.
  - [-] **Implement `/training` page logic**:
    - [-] Remove "Preparing your session..." blocker.
    - [-] Session state machine (Transition -> Active -> Summary).
  - [-] Implement `/models` configuration for Training models (Generator/Evaluator).
  - [-] **Implement `/settings` configuration**:
    - [-] **Read-Aloud Passing Threshold**: Configure the minimum Azure pronunciation score required to pass.
    - [-] New Card Generation Probabilities (Forgot/Hard/Good/Easy).
    - [-] **Clear All Training Cards**: Button with confirmation dialog to delete all cards (keep notes).
- [-] **Debugging & Observability**:
  - [-] Add detailed logging for SRS interval calculations.
  - [-] Implement a "Debug Mode" toggle in Training session to show AI reasoning/prompts.
  - [-] Create a script/tool to verify SQLite data integrity for SRS fields.
  - [-] Add error boundaries and descriptive error states for card generation failures.

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
