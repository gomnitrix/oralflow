import {
  createConversationBubble,
  createConversationSession,
  type ConversationBubble,
  type ConversationBubbleState,
  type ConversationSession,
} from "./models";

export type StwState =
  | "idle"
  | "recording"
  | "pending"
  | "evaluating"
  | "readyToSend"
  | "sent";

export interface EvaluationGateway {
  evaluate: (bubble: ConversationBubble) => Promise<{ evaluationId: string }>;
}

export interface PersistenceGateway {
  saveSession: (session: ConversationSession) => Promise<void>;
}

export interface StwServiceDeps {
  evaluation: EvaluationGateway;
  persistence?: PersistenceGateway;
}

const assertState = (bubble: ConversationBubble, allowed: ConversationBubbleState[]) => {
  if (!allowed.includes(bubble.state)) {
    throw new Error(`Invalid state transition from ${bubble.state}`);
  }
};

export class StopTheWorldService {
  private session: ConversationSession;

  constructor(private readonly deps: StwServiceDeps, session?: ConversationSession) {
    this.session =
      session ??
      createConversationSession({
        scenarioId: "default",
        mode: "stw",
      });
  }

  getSession(): ConversationSession {
    return this.session;
  }

  startRecording(): ConversationSession {
    const bubble = this.currentUserBubble();
    assertState(bubble, ["idle", "sent"]);

    const nextBubble =
      bubble.state === "sent"
        ? createConversationBubble({ sessionId: this.session.id, speaker: "user", state: "recording" })
        : { ...bubble, state: "recording" as const };

    this.replaceUserBubble(nextBubble);
    return this.persist();
  }

  finishRecording(payload: { text: string; audioUrl?: string | null }): ConversationSession {
    const bubble = this.currentUserBubble();
    assertState(bubble, ["recording"]);

    const nextBubble: ConversationBubble = {
      ...bubble,
      text: payload.text,
      audioUrl: payload.audioUrl ?? null,
      state: "pending",
      updatedAt: new Date().toISOString(),
    };
    this.replaceUserBubble(nextBubble);
    return this.persist();
  }

  async evaluate(): Promise<ConversationSession> {
    const bubble = this.currentUserBubble();
    assertState(bubble, ["pending"]);

    const evaluating: ConversationBubble = {
      ...bubble,
      state: "evaluating",
      updatedAt: new Date().toISOString(),
    };
    this.replaceUserBubble(evaluating);
    this.persist();

    const result = await this.deps.evaluation.evaluate(evaluating);
    const ready: ConversationBubble = {
      ...evaluating,
      state: "readyToSend",
      evaluationId: result.evaluationId,
      updatedAt: new Date().toISOString(),
    };
    this.replaceUserBubble(ready);
    return this.persist();
  }

  send(): ConversationSession {
    const bubble = this.currentUserBubble();
    assertState(bubble, ["readyToSend"]);
    const sent: ConversationBubble = {
      ...bubble,
      state: "sent",
      updatedAt: new Date().toISOString(),
    };
    this.replaceUserBubble(sent);
    return this.persist();
  }

  retry(): ConversationSession {
    const bubble = this.currentUserBubble();
    assertState(bubble, ["readyToSend", "sent"]);
    const newBubble = createConversationBubble({
      sessionId: this.session.id,
      speaker: "user",
      state: "recording",
    });
    this.session.bubbles.push(newBubble);
    return this.persist();
  }

  private currentUserBubble(): ConversationBubble {
    const last = [...this.session.bubbles].reverse().find((b) => b.speaker === "user");
    if (last) return last;
    const initial = createConversationBubble({
      sessionId: this.session.id,
      speaker: "user",
      state: "idle",
    });
    this.session.bubbles.push(initial);
    return initial;
  }

  private replaceUserBubble(next: ConversationBubble) {
    const index = this.session.bubbles.findIndex((b) => b.id === next.id);
    if (index >= 0) {
      this.session.bubbles[index] = next;
    } else {
      this.session.bubbles.push(next);
    }
  }

  private persist(): ConversationSession {
    if (this.deps.persistence) {
      void this.deps.persistence.saveSession(this.session);
    }
    return this.session;
  }
}
