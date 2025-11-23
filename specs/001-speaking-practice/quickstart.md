# Quickstart: Oralflow Speaking Practice Loop

**Branch**: `001-speaking-practice`  
**Spec**: `/workspaces/oralflow/specs/001-speaking-practice/spec.md`  
**Plan**: `/workspaces/oralflow/specs/001-speaking-practice/plan.md`

## 1. Running the App (Developer)

1. Install dependencies and run the Next.js dev server.
2. Configure environment variables for AI providers (e.g., OpenAI, Gemini) and local storage path for data.
3. Open the home page and verify navigation to:
   - Stop-the-World mode
   - Zen mode
   - Scenario Studio + Library
   - Notebook
   - Training
   - Ask page

## 2. Core QA Scenarios

### Scenario A: Stop-the-World Coaching Loop

1. Launch a default scenario into StW mode from Home.
2. Record a user utterance and wait for evaluation.
3. Confirm pronunciation, grammar, and naturalness feedback is shown.
4. Retry the utterance at least once and compare feedback history.
5. Use Inspiration Burst and Distill on AI bubbles and save at least one expression to the notebook.

### Scenario B: Scenario Studio + Library

1. Open Scenario Studio and generate a scenario using the AI Generate flow.
2. Edit the normalized card and accept it.
3. Verify it appears in Scenario Library with correct metadata.
4. Launch it in both StW and Zen modes via the Launchpad.

### Scenario C: Zen Mode Session + Report

1. Start Zen mode (from Home or Scenario Launchpad).
2. Hold a short conversation and toggle the transcript on/off.
3. End the session and verify the Session Evaluation Report (pronunciation, grammar, unnatural expressions, extracted expressions).
4. Save at least one extracted expression to the notebook.

### Scenario D: Notebook + SRS Review

1. Open the Notebook and review saved expressions (fields, examples, context sentence, IPA).
2. Start Today’s review tasks from Home.
3. Complete a guided session including all exercise types (answer generation, ask-a-question, translation, read-aloud/shadowing).
4. Apply ratings (Again/Hard/Good/Easy) and verify that next review dates change.

### Scenario E: Ask Page + Quick Training

1. From Home, open the Ask page and request “How do I decline politely?”.
2. Review tone variants and extracted preview cards; save at least one to the notebook.
3. Use Quick Training with custom text on Home to generate ad-hoc training items.
4. Complete a short ad-hoc training session and verify items flow into SRS scheduling if configured.

## 3. Non-Functional Checks

- Verify layout responsiveness on mobile, tablet, and desktop.
- Confirm language toggle (English/Chinese) updates UI labels and helper text.
- Validate that no user recordings or tokens are visible in client code or logs.
- Run test suite and ensure unit, integration, and E2E tests pass for the scenarios above.

