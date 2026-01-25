# OralFlow Product Documentation

**Last Updated**: 2026-01-23  
**Version**: 2.0  
**Status**: Active Development

---

## 1. Product Overview

### 1.1 Vision

OralFlow is an AI-powered English speaking practice application designed to help beginner-to-intermediate language learners overcome the fear of speaking and build a positive feedback loop through structured practice and immersive role-playing.

### 1.2 Core Mechanism

- **Dual-mode Dialogue System**:
  - **Stop-the-World (StW) Mode**: High-scaffolding coaching mode with pause-time mechanics, evaluation gating, and Copilot assistance
  - **Zen Mode**: Real-time immersive conversation for fluency practice
- **Closed-loop Review System**: Anki-like SRS algorithm for long-term retention
- **Practice → Evaluate → Extract → Save → Review → Reuse** learning cycle

### 1.3 Target Users

- Beginner to intermediate English learners (B1+ level)
- Users who experience anxiety when speaking English
- Self-directed learners seeking structured practice

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Runtime | Node.js 20+ |
| Styling | Tailwind CSS with custom design system |
| Database | SQLite (better-sqlite3) with JSON file fallback |
| AI Providers | OpenAI, Google Gemini, AiHubMix, OpenRouter |
| Pronunciation | Microsoft Azure Speech SDK |
| Testing | Jest + Testing Library (unit/integration), Playwright (E2E) |
| Validation | Zod schemas |

### 2.2 Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (public)/                  # Main application routes
│   │   ├── page.tsx               # Home/Dashboard
│   │   ├── stw/page.tsx           # Stop-the-World mode
│   │   ├── zen/page.tsx           # Zen mode
│   │   ├── scenarios/             # Scenario library & creation
│   │   ├── free-chat/page.tsx     # Context-based free chat
│   │   ├── notebook/page.tsx      # Notebook management
│   │   ├── training/page.tsx      # SRS review & training
│   │   ├── ask/page.tsx           # Expression discovery
│   │   ├── models/page.tsx        # AI model configuration
│   │   └── settings/page.tsx      # Application settings
│   ├── api/                       # API routes
│   └── realtime/                  # Realtime handlers (Zen)
├── components/                    # React components
│   ├── conversation/              # StW & Zen UI components
│   ├── copilot/                   # Copilot panel components
│   ├── scenario/                  # Scenario cards & studio
│   ├── notebook/                  # Notebook cards
│   ├── training/                  # Review session UI
│   └── shared/                    # Design system primitives
├── domains/                       # Business logic
│   ├── conversation/              # StW & Zen services
│   ├── copilot/                   # Inspiration & Distill
│   ├── evaluation/                # Pronunciation & grammar
│   ├── scenario/                  # Studio & library
│   ├── notes/                     # Notebook & Ask
│   └── training/                  # SRS engine
├── services/                      # Infrastructure
│   ├── ai/                        # AI client & model routing
│   └── persistence/               # Storage adapters
└── lib/                           # Utilities
    ├── i18n/                      # Localization (en/zh)
    ├── validation/                # Zod schemas
    └── audio/                     # Recording utilities
```

### 2.3 Data Persistence

The application uses a layered persistence strategy:

1. **Primary**: SQLite database via `better-sqlite3`
2. **Fallback**: JSON file storage for environments without native modules
3. **Configuration**: JSON file for AI settings (`ai-settings.json`)

**Storage Location**: Configured via `LOCAL_STORAGE_PATH` environment variable (default: `./local_storage`)

---

## 3. Data Models

### 3.1 ScenarioTemplate

Represents a practice context for role-playing conversations.

```typescript
interface ScenarioTemplate {
  id: string;
  title: string;
  emoji: string;
  description: string;
  learnerRole: string;
  aiRole: string;
  mainGoal: string;
  subGoals: string[];
  sourceType: "manual" | "ai" | "import";
  sourceText: string | null;
  lastPracticedAt: ISODateString | null;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
```

### 3.2 ConversationSession

Captures a single StW or Zen session.

```typescript
interface ConversationSession {
  id: string;
  scenarioId: string;
  mode: "stw" | "zen";
  startedAt: ISODateString;
  endedAt: ISODateString | null;
  status: "active" | "completed" | "aborted";
  bubbles: ConversationBubble[];
  evaluationReportId: string | null;
}
```

### 3.3 ConversationBubble

Individual turn within a conversation.

```typescript
interface ConversationBubble {
  id: string;
  sessionId: string;
  speaker: "user" | "ai";
  text: string;
  audioUrl: string | null;
  state: "idle" | "recording" | "pending" | "evaluating" | "readyToSend" | "sent";
  createdAt: ISODateString;
  updatedAt: ISODateString;
  copilotInsights: CopilotInsight[];
  evaluationId: string | null;
  evaluationSummary?: EvaluationSummary | null;
  evaluationRuns?: EvaluationRun[];
}
```

### 3.4 EvaluationSummary

Extended evaluation data including Azure pronunciation scores.

```typescript
interface EvaluationSummary {
  pronunciationIssues: string[];
  pronunciationScores?: {
    overall?: number;
    accuracy?: number;
    fluency?: number;
    completeness?: number;
    prosody?: number;
  } | null;
  wordScores?: {
    word: string;
    accuracy: number;
    errorType?: string | null;
    phonemes?: { phoneme: string; accuracy: number; ipa?: string; }[];
  }[];
  grammarIssues: string[];
  naturalnessNotes: string[];
  nativeLikeSuggestion: string;
  referenceAudioUrl: string | null;
  pronunciationEnabled?: boolean;
}
```

### 3.5 NotebookItem

Universal learning card format.

```typescript
interface NotebookItem {
  id: string;
  phrase: string;
  meaning: string;
  usageNotes: string;
  variants: string[];
  exampleSentences: string[];
  contextSentence: string;
  ipa: string;
  spokenNotes: string;
  source: "stw" | "zen" | "ask" | "training" | "manual";
  sourceDetails: string;
  tags: string[];
  locale?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  // SRS State
  srsLevel: number;           // Current level/stage (0=New, 1=Learning, ...)
  nextReviewAt: ISODateString; // When it should be reviewed next
  lastReviewedAt: ISODateString | null;
  
  // Difficulty Tracking
  lastDifficulty: "forgot" | "hard" | "good" | "easy" | null;
  easeFactor: number;         // Multiplier for interval calculation
  intervalDays: number;       // Current interval
}
```

### 3.6 ReviewCard

Stores specific exercise instances.

```typescript
type CardType = "answer_generation" | "ask_question" | "translation" | "read_aloud";

interface ReviewCard {
  id: string;
  notebookItemId: string;
  type: CardType;
  
  // Content
  content: {
    front: {
      title: string;
      prompt: string;         // Instruction. MUST NOT contain the target phrase directly,
                              // BUT must strongly hint at the meaning/metaphor of the cue.
      cue?: string | null;    // The target phrase (NotebookItem.phrase).
      context?: string | null;// Background / Chinese text / English text to read
    };
    back: {
      referenceAnswer: string;
      notes?: string[];
    };
  };
  metadata: {
    locale?: string;
    source?: "generated" | "manual" | "import";
    tags?: string[];
  } | null;
  
  // Metadata
  createdAt: ISODateString;
  lastUsedAt: ISODateString | null;
  usageCount: number;
}
```

### 3.6 ReviewTask

SRS scheduling entity.

```typescript
interface ReviewTask {
  id: string;
  notebookItemId: string;
  dueAt: ISODateString;
  lastReviewedAt: ISODateString | null;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  status: "pending" | "completed";
}
```

### 3.7 StructuredNote (Copilot Output)

Format for Copilot Distill/Inspiration responses.

```typescript
interface StructuredNote {
  id: string;
  content: string;                   // Phrase/idiom/collocation
  explanation: {
    en: string;
    zh: string;
  };
  examples: string[];                // 2-3 spoken-English samples
}
```

---

## 4. Feature Modules

### 4.1 Home / Dashboard

**Route**: `/`

**Purpose**: Central hub for quick navigation and session overview.

**Elements**:
- Welcome greeting with user stats
- Today's practice time & review cards due
- Quick actions: Create Scenario, Start Review, Quick Lookup, Focused Drills
- Continue practicing section (last scenario)

### 4.2 Stop-the-World Mode (StW)

**Route**: `/stw`

**Purpose**: High-scaffolding coaching mode for deliberate practice.

**Features**:
- Chat-bubble transcript with keyboard navigation (J/K)
- State machine: `idle → recording → pending → evaluating → readyToSend → sent`
- Copilot panel (right side) with:
  - **Distill**: Extract phrases from AI bubbles
  - **Inspiration Burst**: Get context-aware suggestions for next turn
- Pre-send evaluation gating:
  - Pronunciation assessment (Azure Speech SDK)
  - Grammar analysis
  - Naturalness suggestions
  - "A native speaker would say..." alternatives
- Retry history for comparing attempts
- Save to notebook from Copilot suggestions
- Goal evaluation after configurable turn count

**API Endpoints**:
- `POST /api/conversation/stw` - Session management
- `POST /api/conversation/stw-evaluate` - Bubble evaluation

### 4.3 Zen Mode

**Route**: `/zen`

**Purpose**: Real-time immersive conversation for fluency practice.

**Features**:
- Minimalist UI with animated agent states (listening/thinking/speaking)
- Collapsible transcript panel
- Real-time audio streaming (Realtime API)
- Post-session Evaluation Report:
  - Pronunciation findings
  - Grammar issues
  - Naturalness notes
  - Extracted expressions with save-to-notebook actions

**API Endpoints**:
- `POST /api/reports/zen` - Generate session report
- WebSocket handler at `/realtime/zen/route.ts`

### 4.4 Free Chat

**Route**: `/free-chat`

**Purpose**: Quick context-based practice without creating a saved scenario.

**Features**:
- Paste any text as context (article, email, notes)
- AI translation to English if needed
- AI-generated summary for long passages
- Optional title and role customization
- Launch directly into StW or Zen mode
- Context passed via URL parameters (not persisted as scenario)

**API Endpoints**:
- `POST /api/free-chat/draft` - Prepare context with AI

### 4.5 Scenario Studio & Library

**Routes**: `/scenarios`, `/scenarios/create`

**Purpose**: Create, manage, and launch practice scenarios.

**Scenario Creation Methods**:
1. **Manual Draft**: Form-based input (title, roles, goals)
2. **AI Generate**: Keywords → full scenario
3. **Import Text**: Paste text → AI extracts context

**Library Features**:
- Grid of scenario cards with emoji/thumbnail
- Search and filter capabilities
- Card menu: Edit, View Details, Delete
- Launchpad modal for mode selection before starting

**API Endpoints**:
- `POST /api/scenarios/generate` - AI scenario generation
- `GET/POST/DELETE /api/scenarios/crud` - CRUD operations

### 4.6 Notebook

**Route**: `/notebook`

**Purpose**: Manage saved expressions and learning items.

**Features**:
- List view with edit/delete actions
- Normalized card format with all fields
- Source tracking (StW, Zen, Ask, Training, Manual)
- Celebratory empty state with shortcuts to Ask/Scenarios

**API Endpoints**:
- `GET/POST/DELETE /api/notes/items` - CRUD operations
- `POST /api/ask/save` - Save from Ask page

### 4.7 Training & Review

**Route**: `/training`

**Purpose**: Spaced repetition review with guided exercises.

#### 4.7.1 Core Concepts

- **The "Notebook Item" as the Anchor**: The `NotebookItem` is the unit of knowledge. It tracks its own SRS state (Next review date, difficulty) and acts as the seed for generating `ReviewCards`.
- **The "Review Card" as the Vehicle**: A `ReviewCard` is a specific exercise instance derived from a `NotebookItem`.
  - **Dynamic Generation**: Cards are generated by AI to provide varied contexts.
  - **Persistence**: Generated cards are saved to SQLite to build a library of proven exercises.
  - **Reuse Strategy**: The system balances between generating fresh cards (to test generalization) and reusing existing cards (reinforcement), based on user difficulty.
- **The "Review Session"**: A daily session consisting of a queue of `NotebookItems` due for review.
  - **Stack UI**: Cards are presented in a visual stack.
  - **Interaction**: Read/Listen -> Record Answer -> AI Eval -> Feedback -> Rating.

#### 4.7.2 Card Types & Structures

**1. Answer Generation (回答生成)**
*Goal*: Use the target expression to respond naturally.
*   **Front**: Context + Task (Hinting at phrase) + Hidden Cue.
*   **Back**: Reference Answer.

**2. Ask a Question (提问练习)**
*Goal*: Use the target expression to initiate.
*   **Front**: Context + Task (Hinting at phrase) + Hidden Cue.
*   **Back**: Reference Answer.

**3. Translation (中译英)**
*Goal*: Map L1 to L2.
*   **Front**: Chinese Sentence + Task + Hidden Cue.
*   **Back**: English Translation.

**4. Read Aloud (朗读/跟读)**
*Goal*: Pronunciation.
*   **Front**: English Sentence + Task + Hidden Cue.
*   **Back**: Reference Answer (Same as context).

#### 4.7.3 Logic & Algorithms

**1. Card Quantity & Generation**
The number of cards and the probability of generating *new* cards depend on the user's last difficulty rating.

*   **Card Count**: `N = 5 - D`, where `D` = 1 (Forgot), 2 (Hard), 3 (Good), 4 (Easy).
*   **New Card Probability**: Configurable in Settings. Defaults:
    * Forgot: 50% new
    * Hard: 30% new
    * Good: 30% new
    * Easy: 20% new

**2. Audio Strategy**
*   **On-Demand**: Card Back has a "Play Audio" button.
*   **Caching**: Client requests TTS -> Server generates/fetches -> Client plays.

**3. SRS Scheduling (Simplified SM-2)**
*   **Forgot**: Interval = 1 day. Ease = Ease - 0.2.
*   **Hard**: Interval = Current * Ease * 1.2. Ease = Ease - 0.15.
*   **Good**: Interval = Current * Ease. Ease = Same.
*   **Easy**: Interval = Current * Ease * 1.3. Ease = Ease + 0.15.

#### 4.7.4 Prompt Engineering

Each card type uses a specific System Prompt to ensure stable generation quality.
*   **Common Constraints**: Strictly Valid JSON, Context/Task in English, Cue Hiding (Task must not contain the exact target phrase).

#### 4.7.5 User Interface & Flow

- **Top**: Modern Progress Bar (Visualizes remaining cards).
- **Center**: Stacked Cards (Top active, bottom peeking).
- **Bottom**: Control Bar (Idle -> Recording -> Evaluating -> Result).
- **Right**: Copilot Panel (Distill only).
- **Interaction**:
  1.  **Present**: Card Front shows.
  2.  **Action**: User holds Space / Clicks Mic to record.
  3.  **Eval**: AI evaluates audio. (Pass -> Flip / Fail -> Retry/Skip).
  4.  **Review**: Card Back shows reference.
  5.  **Completion**: If last card for item -> Difficulty Overlay [Forgot/Hard/Good/Easy] -> Next Item.

**API Endpoints**:
- `POST /api/training/session/start` - Generate review queue
- `POST /api/training/card/evaluate` - Submit audio/text for evaluation
- `POST /api/training/item/rate` - Submit SRS rating
- `GET /api/training/audio` - Generate TTS on-demand

### 4.8 Ask Page

**Route**: `/ask`

**Purpose**: Expression discovery ("How do I say X in English?")

**Features**:
- Free-form prompt input
- AI returns 2-3 tone-specific variants
- Expression preview cards with:
  - Text and meaning
  - Tone indicator (formal/neutral/casual)
  - Usage notes
  - One-click save to Notebook

**API Endpoints**:
- `POST /api/ask` - Query expressions
- `POST /api/ask/save` - Save suggestion to notebook

### 4.9 AI Model Management

**Route**: `/models`

**Purpose**: Configure AI providers and model assignments.

**Sections**:

1. **Provider Status**: Shows configured providers (OpenAI, Gemini, AiHubMix, OpenRouter)
2. **Model Categories**: Language, TTS, STT, Realtime Speech
3. **Scenario Assignments**:
   - Zen: Realtime model
   - StW: Chat, STT, TTS, Assessment
   - Copilot: Distill, Inspiration
   - Other: Scenario draft, Ask AI, Review notes, Free chat

**API Endpoints**:
- `GET /api/ai/providers` - List providers
- `GET/POST /api/ai/settings` - Model settings

### 4.10 Settings

**Route**: `/settings`

**Purpose**: Application-wide configuration.

**Options**:
- Copilot levels (Distill/Inspiration)
- StW goal evaluation start turn (1-10)
- Pronunciation assessment granularity (phoneme/word/fulltext)

---

## 5. AI Service Architecture

### 5.1 Provider Manager

Supports multiple AI providers with capability detection:

| Provider | Type | Capabilities |
|----------|------|--------------|
| OpenAI | First-party | Language, TTS, STT, Realtime, Embedding |
| Gemini | First-party | Language, TTS, STT, Realtime, Embedding |
| AiHubMix | Third-party | Language, TTS, STT, Embedding |
| OpenRouter | Third-party | Language, TTS, STT, Embedding |

### 5.2 Model Routing

Dynamic routing based on capability assignments:

```typescript
type AssignmentCapability =
  | "zen_realtime"      // Zen Mode real-time
  | "stw_chat"          // StW conversation
  | "stw_stt"           // StW speech-to-text
  | "stw_tts"           // StW text-to-speech
  | "stw_assessment_text"// StW grammar/naturalness
  | "stw_goal"          // Goal evaluation
  | "copilot_distill"   // Distill phrases
  | "copilot_inspiration"// Inspiration suggestions
  | "scenario_draft"    // Scenario generation
  | "ask_ai"            // Ask page queries
  | "review_notes"      // Note formatting
  | "free_chat_draft"   // Free chat prep
  | "zen_goal";         // Zen goal evaluation
```

### 5.3 Pronunciation Assessment

Uses Microsoft Azure Speech SDK for:
- Word-level accuracy scores
- Phoneme-level analysis
- Fluency, completeness, and prosody metrics
- Error type detection

---

## 6. Design System

### 6.1 Colors

| Token | Value | Usage |
|-------|-------|-------|
| `custom-primary` | #FFAB91 | Primary actions, highlights |
| `custom-accent` | #80CBC4 | Secondary highlights |
| `custom-bg` | #FDFBF8 | Page background |
| `custom-text-dark` | #4E4A47 | Primary text |
| `custom-border` | #EAE6E1 | Borders, dividers |

### 6.2 Typography

- **Font Family**: Lexend (Google Fonts)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold), 800 (extra-bold)

### 6.3 Icons

Material Symbols Outlined (Google Fonts)

---

## 7. Localization

Supports English (`en`) and Chinese (`zh`) with message catalogs in `src/lib/i18n/`.

Translation keys cover:
- Navigation labels
- StW and Zen mode UI
- Notebook and Training
- Ask page

---

## 8. API Reference

### 8.1 Conversation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/conversation/stw` | StW session management |
| POST | `/api/conversation/stw-evaluate` | Evaluate user bubble |

### 8.2 Scenarios

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/scenarios/crud` | List scenarios |
| POST | `/api/scenarios/crud` | Create/update scenario |
| DELETE | `/api/scenarios/crud` | Delete scenario |
| POST | `/api/scenarios/generate` | AI-generate scenario |

### 8.3 Notes & Ask

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notes/items` | List notebook items |
| POST | `/api/notes/items` | Create/update item |
| DELETE | `/api/notes/items` | Delete item |
| POST | `/api/ask` | Query expressions |
| POST | `/api/ask/save` | Save suggestion |

### 8.4 Training

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/training/schedule` | Generate review queue |

### 8.5 AI Configuration

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ai/providers` | List providers |
| GET | `/api/ai/settings` | Get settings |
| POST | `/api/ai/settings` | Update settings |

### 8.6 Free Chat

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/free-chat/draft` | Prepare context |

### 8.7 Reports

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/reports/zen` | Generate Zen report |

---

## 9. Navigation Map

```
/                     → Home/Dashboard
├── /scenarios        → Scenario Library
│   └── /create       → Scenario Studio
├── /stw              → Stop-the-World Mode
├── /zen              → Zen Mode
├── /free-chat        → Free Chat
├── /ask              → Expression Discovery
├── /notebook         → Notebook
├── /training         → Training & Review
├── /models           → AI Model Config
├── /settings         → Settings
└── /profile          → Profile (placeholder)
```

---

## 10. State Machine - StW Bubble

```
┌──────┐
│ idle │
└──┬───┘
   │ startRecording()
   ▼
┌───────────┐
│ recording │
└──────┬────┘
       │ stopRecording()
       ▼
┌─────────┐
│ pending │◄────────────────────┐
└────┬────┘                     │
     │ startEvaluation()        │ retry()
     ▼                          │
┌────────────┐                  │
│ evaluating │──────────────────┘
└─────┬──────┘
      │ evaluationComplete()
      ▼
┌─────────────┐
│ readyToSend │
└──────┬──────┘
       │ send()
       ▼
┌──────┐
│ sent │
└──────┘
```

---

## 11. Copilot Structured Notes Format

```json
[
  {
    "id": "note_abc123",
    "content": "take a rain check",
    "explanation": {
      "en": "To decline an invitation with the intention of accepting it at a later time",
      "zh": "婉拒邀请，但暗示以后会接受"
    },
    "examples": [
      "I'd love to join you for dinner, but can I take a rain check?",
      "She had to take a rain check on the movie because of work.",
      "Thanks for the offer—I'll take a rain check this time."
    ]
  }
]
```
