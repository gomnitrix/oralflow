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
| StW Mode | 8 | 3 | 0 | 1 |
| Scenario Studio | 6 | 0 | 3 | 0 |
| Zen Mode | 3 | 3 | 0 | 4 |
| Notebook | 4 | 0 | 2 | 7 |
| Training & Review | 0 | 0 | 2 | 6 |
| Ask & Dashboard | 10 | 1 | 2 | 5 |
| Free Chat | 5 | 1 | 1 | 5 |
| Profile & Personalization | 4 | 0 | 1 | 2 |
| AI & Infrastructure | 0 | 0 | 0 | 1 |
| Additional Features | 8 | 1 | 0 | 0 |

---

## Verified ✅

---

## Partial / Needs Work [~]

### Conversation Shell
- [-] **Implement session exit protection for sidebar navigation**: Currently, clicking sidebar links during an active STW or Zen session exits immediately. **Expected behavior**: Sidebar navigation should trigger the same confirmation dialog as the manual exit button to prevent accidental data loss.

### Scenario Studio
- [~] Integration tests for scenario flows - basic coverage

### Notebook
- [~] Notebook card details need polish and field completion
- [-] **Optimize TTS experience**:
  - [-] **Audio caching**: Cache generated TTS audio for phrases in-memory so subsequent plays don't require new API requests.
  - [-] **Loading state UI**: Update the TTS button icon/style (e.g., gray out or show spinner) while waiting for the audio response to provide visual feedback.

### Training & Review
- [-] SRS engine with Anki-like scheduling - basic implementation
- [-] `/api/training/schedule` endpoint - basic implementation

### Ask Page
- [-] **Enhance Ask page result interaction**:
  - [-] **Add edit functionality**: Provide an edit icon for generated notes to allow users to modify content before saving to Notebook.
  - [-] **Add save notification**: Show a success message or toast after clicking "Save to Notebook" to confirm the action.

### Free Chat
- [~] Free Chat page UI needs significant improvements
  - [x] Fix header: currently shows both "Free Chat" (small label) AND "Context Chat" (large title) - keep only the styled header format but change content to "Free Chat" (align with other pages' header style)
  - [x] Simplify description: current text "Paste any text as context, let AI translate/clean it, and jump into a conversation with Zen or Stop The World. Nothing is saved as a scenario." is too verbose - condense to core value proposition
  - [x] Remove input fields: Title (optional), Your Role, AI Role - keep ONLY the Context textarea
  - [x] Add Edit button (top-right) to Context Preview card
  - [x] Enable in-place editing: after clicking Edit, title/context/summary fields in preview card become editable inline
    - [x] **Refine summary input UI: focus state and border reset**: The summary input field in Free Chat displays a native black border and a blue focus ring when active, breaking the custom design.

### Profile & Personalization
- [-] **Integration - Home Greeting**: Replace the hardcoded "Alex" in the dashboard greeting with the actual username from profile settings.
  - [-] **Fix Home Greeting flicker**: Username in dashboard greeting flickers from default "Learner" to custom name on page load.
- [-] **Integration - STW Avatar**: Use the user's chosen avatar in the Stop-the-World conversation bubbles.
- [-] **Fix sidebar profile avatar**: Sidebar profile button does not update to show the user's uploaded avatar.

### Zen Mode
- [-] Zen orchestration service
- [-] Zen evaluation report generation
- [-] Integration tests for Zen session

### AI & Infrastructure
- [-] **Fix OpenRouter GPT-Audio-Mini compatibility**: The `openai/gpt-audio-mini` model on OpenRouter is currently non-functional, while existing `gpt-4o-mini-tts` (via AIHubMix) works correctly. 
  - **Requirement**: Implement a broad and elegant compatibility layer for different provider input/output formats. Avoid hardcoding logic based on specific model names.
  - **Reference**: See OpenRouter's audio model example below. Ensure the fix does not break existing provider integrations.
  - **Reference Code**:
    ```javascript
      import { OpenRouter } from "@openrouter/sdk";

      const openrouter = new OpenRouter({
        apiKey: "<OPENROUTER_API_KEY>"
      });

      const stream = await openrouter.chat.send({
        model: "openai/gpt-audio-mini",
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "What is in this audio?"
              },
              {
                "type": "input_audio",
                "input_audio": {
                  "data": "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB",
                  "format": "wav"
                }
              }
            ]
          }
        ],
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      }
    ```

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
