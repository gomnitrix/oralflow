# OralFlow Implementation Tasks

**Last Updated**: 2026-01-23  
**Status**: ~90% Complete

---

## Legend

- [x] Completed
- [ ] Pending
- [~] Partial / Needs Integration

---

## Summary

| Category | Complete | Pending |
|----------|----------|---------|
| Infrastructure | 9/9 | 0 |
| StW Mode | 11/11 | 0 |
| Scenario Studio | 7/7 | 0 |
| Zen Mode | 6/6 | 3 integration |
| Notebook & Training | 8/8 | 0 |
| Ask & Dashboard | 7/7 | 0 |
| Additional Features | 14/14 | 0 |
| Polish | 5/12 | 7 |
| **Total** | **67/74** | **10** |

---

## Completed ✅

### Infrastructure
- [x] Next.js App Router setup with TypeScript strict mode
- [x] Domain module scaffolding (`src/domains/`)
- [x] Entity interfaces and factory helpers
- [x] Storage adapter + repository pattern
- [x] Unified AI client with multi-provider support
- [x] Zod validation schemas
- [x] i18n scaffolding (en/zh)
- [x] Tailwind design system with custom tokens
- [x] Jest + Playwright test setup

### Stop-the-World Mode
- [x] Conversation state machine (idle → recording → pending → evaluating → readyToSend → sent)
- [x] Pronunciation/grammar/naturalness evaluators
- [x] Inspiration Burst + Distill services
- [x] `/api/conversation/stw-evaluate` endpoint
- [x] StW shell UI with bubble list and controls
- [x] Copilot panel UI (Inspiration/Distill tabs)
- [x] Save-to-notebook from Copilot
- [x] Default seed scenario
- [x] Unit tests for state machine
- [x] Keyboard navigation (J/K)
- [x] Component tests for StW shell

### Scenario Studio & Library
- [x] Scenario Studio normalization (manual/AI/import)
- [x] Scenario Library CRUD + search
- [x] `/api/scenarios/generate` and `/api/scenarios/crud` endpoints
- [x] Scenario Studio UI
- [x] Scenario Library grid + Launchpad modal
- [x] Launch actions to StW/Zen routes
- [x] Integration tests for scenario flows

### Zen Mode
- [x] Zen orchestration service
- [x] Realtime handler scaffolding
- [x] Zen UI shell (HUD, transcript toggle, animations)
- [x] Zen evaluation report generation
- [x] Session transcript persistence
- [x] Integration tests for Zen session

### Notebook & Training
- [x] Notebook service with normalized cards
- [x] SRS engine with Anki-like scheduling
- [x] `/api/notes/items` and `/api/training/schedule` endpoints
- [x] Notebook UI with edit/delete
- [x] Training/Review page with exercises
- [x] Rating controls (Again/Hard/Good/Easy)
- [x] Unit tests for SRS scheduler
- [x] Celebratory empty states

### Ask & Dashboard
- [x] Ask service with tone-tagged suggestions
- [x] `/api/ask` endpoint
- [x] Ask page UI with preview cards
- [x] Home dashboard with quick actions
- [x] Quick Training text ingestion
- [x] Integration tests for Ask + Training
- [x] Celebratory empty states on Home

### Additional Features
- [x] Free Chat page with context input
- [x] `/api/free-chat/draft` endpoint
- [x] Free Chat → StW/Zen launch
- [x] ProviderManager for multi-provider support
- [x] SettingsService for model assignments
- [x] `/api/ai/settings` and `/api/ai/providers` endpoints
- [x] Models page with provider status
- [x] Settings persistence (`ai-settings.json`)
- [x] StructuredNote model for Copilot output
- [x] Distill/Inspiration structured format
- [x] B1+ level targeting in prompts
- [x] Azure Speech SDK integration
- [x] Phoneme/word/fulltext granularity options
- [x] Word-level pronunciation scores in UI

### Polish (Partial)
- [x] Microphone denial recovery UI
- [x] English language catalog complete
- [x] Chinese language catalog scaffolded
- [x] E2E spec files created
- [x] Documentation updated

---

## Pending ⏳

### Audio Integration (High Priority)
- [ ] Browser microphone recording implementation
- [ ] Audio visualization during recording
- [ ] TTS playback for AI responses
- [ ] Reference audio generation for pronunciation

### Zen Real-time (High Priority)
- [ ] Real-time WebSocket audio streaming
- [ ] Live STT during Zen conversation
- [ ] TTS audio playback in Zen

### Testing (Medium Priority)
- [ ] E2E tests passing with full coverage
- [ ] CI pipeline integration

### Polish (Lower Priority)
- [ ] AI failure retry mechanism
- [ ] Offline/reconnection recovery in Zen
- [ ] Full Chinese translation
- [ ] Mobile responsive layouts
- [ ] Bottom navigation for mobile
- [ ] Release checklist

---

## Priority Queue

### Tier 1 - Core Functionality
1. Audio integration (recording, playback, visualization)
2. Zen real-time streaming (WebSocket, STT, TTS)
3. E2E test completion

### Tier 2 - Robustness
4. Offline recovery in Zen
5. AI failure retry UI
6. Full Chinese translation

### Tier 3 - Polish
7. Mobile responsive design
8. Bottom navigation
9. Release checklist

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

### Key API Files
- `src/app/api/conversation/stw-evaluate/route.ts` - Evaluation
- `src/app/api/scenarios/generate/route.ts` - Scenario generation
- `src/app/api/ai/settings/route.ts` - AI settings
