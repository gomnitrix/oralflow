import {
  createConversationBubble,
  createConversationSession,
  type ConversationBubble,
  type ConversationSession,
} from "./models";

export interface ZenEvent {
  type: "user.audio.chunk" | "user.audio.end" | "control.endSession";
  sessionId: string;
  utteranceId?: string;
  sequence?: number;
  chunk?: ArrayBuffer;
}

export interface ZenEmitter {
  emit: (event: ZenEvent) => void;
}

export interface ZenServiceDeps {
  emitter: ZenEmitter;
}

export class ZenService {
  private session: ConversationSession;
  private readonly bubbles: ConversationBubble[] = [];

  constructor(private readonly deps: ZenServiceDeps, sessionId?: string) {
    this.session =
      sessionId !== undefined
        ? createConversationSession({ id: sessionId, scenarioId: "default", mode: "zen" })
        : createConversationSession({ scenarioId: "default", mode: "zen" });
  }

  getSession(): ConversationSession {
    return { ...this.session, bubbles: [...this.bubbles] };
  }

  appendUserChunk(chunk: ArrayBuffer, sequence: number) {
    this.deps.emitter.emit({
      type: "user.audio.chunk",
      sessionId: this.session.id,
      chunk,
      sequence,
    });
  }

  endUserUtterance(utteranceId: string) {
    const bubble = createConversationBubble({
      sessionId: this.session.id,
      speaker: "user",
      text: "",
      audioUrl: null,
      state: "pending",
    });
    this.bubbles.push({ ...bubble, id: utteranceId });

    this.deps.emitter.emit({
      type: "user.audio.end",
      sessionId: this.session.id,
      utteranceId,
    });
  }

  endSession(reason: string = "ended") {
    this.session = { ...this.session, status: reason === "ended" ? "completed" : "aborted" };
    this.deps.emitter.emit({
      type: "control.endSession",
      sessionId: this.session.id,
    });
  }
}
