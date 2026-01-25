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
- [-] **Backend Services**:
  - [-] Implement SRS Scheduling Algorithm (Service) with 'Forgot' logic (1-day interval).
  - [-] **Fix Card Generator Service**: Strictly follow the design document for card types and prompts.
    - DESIGN DOC 
      ```markdown
      4. Card Types & Structures
        4.1 Answer Generation (回答生成)
        Goal: Use the target expression to respond naturally.

        JSON Structure:

        {
          "type": "answer_generation",
          "frontContent": {
            "context": "Your friend invites you to dinner tonight, but you are busy.",
            "task": "Decline politely, implying you would like to accept the invitation at a later time.", 
            "cue": "take a rain check"
          },
          "backContent": {
            "referenceAnswer": "I'd love to, but can I take a rain check?"
          }
        }
        UI: cue is shown as [*****]. User must recall "take a rain check" based on context + task hint.

        4.2 Ask a Question (提问练习)
        Goal: Use the target expression to initiate.

        JSON Structure:

        {
          "type": "ask_question",
          "frontContent": {
            "context": "You are at a restaurant and finished eating.",
            "task": "Ask the waiter for the bill (use the standard American term).",
            "cue": "check"
          },
          "backContent": {
            "referenceAnswer": "Could we get the check, please?"
          }
        }
        4.3 Translation (中译英)
        Goal: Map L1 to L2.

        JSON Structure:

        {
          "type": "translation",
          "frontContent": {
            "context": "我们可以改天吗？",
            "task": "Translate the sentence.",
            "cue": "rain check"
          },
          "backContent": {
            "referenceAnswer": "Can we take a rain check?"
          }
        }
        4.4 Read Aloud (朗读/跟读)
        Goal: Pronunciation.

        JSON Structure:

        {
          "type": "read_aloud",
          "frontContent": {
            "context": "I'd love to join, but I'll have to take a rain check.",
            "task": "Read the sentence aloud.",
            "cue": "take a rain check" // Highlighted in the sentence
          },
          "backContent": {
            "referenceAnswer": "I'd love to join, but I'll have to take a rain check."
          }
        }
        5. Prompt Engineering
        To ensure stable generation quality, each card type uses a specific System Prompt.

        5.1 Common Constraints
        Output Format: Strictly Valid JSON.
        Language: Context/Task in English (unless specified), Reference in English.
        Cue Hiding: The task MUST NOT contain the exact target phrase (cue). It should hint at the meaning or metaphor.
        5.2 Prompts by Type
        Type: Answer Generation
        System Prompt:

        You are an English teaching assistant. Generate a practice card for the target phrase: "{phrase}".
        Type: Answer Generation.
        Goal: Create a scenario where the user must use the phrase to respond naturally.
        Output JSON structure:
        {
          "type": "answer_generation",
          "frontContent": {
            "context": "Brief situation description (1-2 sentences).",
            "task": "Instruction for the user. MUST hint at the phrase's meaning/metaphor but NOT contain the phrase itself.",
            "cue": "{phrase}"
          },
          "backContent": {
            "referenceAnswer": "A natural response sentence containing the phrase."
          }
        }
        Example for 'rain check':
        Context: "Your friend invites you to dinner, but you are busy."
        Task: "Decline politely, implying you want to reschedule."
        Reference: "I'd love to, but can I take a rain check?"
        Type: Ask a Question
        System Prompt:

        You are an English teaching assistant. Generate a practice card for the target phrase: "{phrase}".
        Type: Ask a Question.
        Goal: Create a scenario where the user must use the phrase to ask a question or make a request.
        Output JSON structure:
        {
          "type": "ask_question",
          "frontContent": {
            "context": "Brief situation description.",
            "task": "Instruction to ask a question. MUST hint at the phrase's meaning but NOT contain the phrase itself.",
            "cue": "{phrase}"
          },
          "backContent": {
            "referenceAnswer": "A natural question containing the phrase."
          }
        }
        Example for 'check':
        Context: "You finished eating at a restaurant."
        Task: "Ask the waiter for the bill using the standard American term."
        Reference: "Could we get the check, please?"
        Type: Translation
        System Prompt:

        You are an English teaching assistant. Generate a practice card for the target phrase: "{phrase}".
        Type: Translation.
        Goal: Translate a Chinese sentence that perfectly maps to the target phrase.
        Output JSON structure:
        {
          "type": "translation",
          "frontContent": {
            "context": "Chinese sentence to translate.",
            "task": "Translate the sentence.",
            "cue": "{phrase}"
          },
          "backContent": {
            "referenceAnswer": "The English translation containing the phrase."
          }
        }
        Example for 'rain check':
        Context: "我们可以改天吗？"
        Reference: "Can we take a rain check?"
        Type: Read Aloud
        System Prompt:

        You are an English teaching assistant. Generate a practice card for the target phrase: "{phrase}".
        Type: Read Aloud.
        Goal: Provide a natural sentence containing the phrase for pronunciation practice.
        Output JSON structure:
        {
          "type": "read_aloud",
          "frontContent": {
            "context": "A natural sentence containing the phrase.",
            "task": "Read the sentence aloud.",
            "cue": "{phrase}"
          },
          "backContent": {
            "referenceAnswer": "Same as context."
          }
        }
      ```
    - [-] Ensure "Supplemental Generation" logic (don't delete existing cards).
  - [-] **Fix Card Evaluator Service**:
    - [-] Remove `score` field from evaluation prompts and logic.
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
- [-] **Frontend - Components**:
  - [-] Create `CardStack` layout component with "peeking" effect.
  - [-] Create `ReviewCard` component with 3D flip animation.
  - [-] Create `TrainingControlBar` (Record/Skip/Retry).
  - [-] Create `DifficultySelector` overlay with time intervals.
  - [-] Create `TrainingProgressBar` component.
  - [-] Update `Copilot` for Training mode (Distill only).
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
