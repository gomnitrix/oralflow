export {};
import type { ExpressionSuggestion } from "../notes/models";

export type ConversationMode = "stw" | "zen";
export type ConversationStatus = "active" | "completed" | "aborted";
export type ConversationBubbleState =
  | "idle"
  | "recording"
  | "pending"
  | "evaluating"
  | "readyToSend"
  | "sent";
export type SpeakerRole = "user" | "ai";
export type ISODateString = string;

export interface CopilotInsight {
  id: string;
  bubbleId: string;
  type: "inspiration" | "distill";
  title: string;
  description: string;
  suggestedExpressions: ExpressionSuggestion[];
  structuredNotes?: import("../copilot/models").StructuredNote[] | null;
}

export interface EvaluationRecord {
  id: string;
  bubbleId: string;
  createdAt: ISODateString;
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
    phonemes?: {
      phoneme: string;
      accuracy: number;
    }[];
  }[];
  grammarIssues: string[];
  naturalnessNotes: string[];
  nativeLikeSuggestion: string;
  referenceAudioUrl: string | null;
}

export interface ConversationBubble {
  id: string;
  sessionId: string;
  speaker: SpeakerRole;
  text: string;
  audioUrl: string | null;
  state: ConversationBubbleState;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  copilotInsights: CopilotInsight[];
  evaluationId: string | null;
  evaluationSummary?: {
    pronunciationIssues: string[];
    pronunciationScores?: EvaluationRecord["pronunciationScores"];
    wordScores?: EvaluationRecord["wordScores"];
    grammarIssues: string[];
    naturalnessNotes: string[];
    nativeLikeSuggestion: string;
    referenceAudioUrl: string | null;
    pronunciationEnabled?: boolean;
  } | null;
}

export interface ConversationSession {
  id: string;
  scenarioId: string;
  mode: ConversationMode;
  startedAt: ISODateString;
  endedAt: ISODateString | null;
  status: ConversationStatus;
  bubbles: ConversationBubble[];
  evaluationReportId: string | null;
}

export interface SessionEvaluationReport {
  id: string;
  sessionId: string;
  createdAt: ISODateString;
  pronunciationFindings: string[];
  grammarFindings: string[];
  naturalnessFindings: string[];
  extractedExpressionIds: string[];
}

const nowIso = (): ISODateString => new Date().toISOString();
const generateId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2, 10)}`;

export const createCopilotInsight = (
  input: Omit<CopilotInsight, "id"> & { id?: string }
): CopilotInsight => ({
  id: input.id ?? generateId(),
  bubbleId: input.bubbleId,
  type: input.type,
  title: input.title,
  description: input.description,
  suggestedExpressions: input.suggestedExpressions ?? [],
  structuredNotes: input.structuredNotes ?? null,
});

export const createConversationBubble = (
  input: Pick<ConversationBubble, "sessionId" | "speaker"> &
    Partial<Omit<ConversationBubble, "sessionId" | "speaker">>
): ConversationBubble => {
  const timestamp = nowIso();
  return {
    id: input.id ?? generateId(),
    sessionId: input.sessionId,
    speaker: input.speaker,
    text: input.text ?? "",
    audioUrl: input.audioUrl ?? null,
    state: input.state ?? "idle",
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    copilotInsights: input.copilotInsights ?? [],
    evaluationId: input.evaluationId ?? null,
    evaluationSummary: input.evaluationSummary ?? null,
  };
};

export const createConversationSession = (
  input: Pick<ConversationSession, "scenarioId" | "mode"> &
    Partial<Omit<ConversationSession, "scenarioId" | "mode">>
): ConversationSession => {
  const timestamp = nowIso();
  return {
    id: input.id ?? generateId(),
    scenarioId: input.scenarioId,
    mode: input.mode,
    startedAt: input.startedAt ?? timestamp,
    endedAt: input.endedAt ?? null,
    status: input.status ?? "active",
    bubbles: input.bubbles ?? [],
    evaluationReportId: input.evaluationReportId ?? null,
  };
};

export const createEvaluationRecord = (
  input: Pick<EvaluationRecord, "bubbleId" | "pronunciationIssues" | "grammarIssues" | "naturalnessNotes"> &
    Partial<Omit<EvaluationRecord, "bubbleId" | "pronunciationIssues" | "grammarIssues" | "naturalnessNotes">>
): EvaluationRecord => ({
  id: input.id ?? generateId(),
  bubbleId: input.bubbleId,
  createdAt: input.createdAt ?? nowIso(),
  pronunciationIssues: input.pronunciationIssues,
  pronunciationScores: input.pronunciationScores ?? null,
  wordScores: input.wordScores ?? [],
  grammarIssues: input.grammarIssues,
  naturalnessNotes: input.naturalnessNotes,
  nativeLikeSuggestion: input.nativeLikeSuggestion ?? "",
  referenceAudioUrl: input.referenceAudioUrl ?? null,
});

export const createSessionEvaluationReport = (
  input: Pick<SessionEvaluationReport, "sessionId"> &
    Partial<Omit<SessionEvaluationReport, "sessionId">>
): SessionEvaluationReport => ({
  id: input.id ?? generateId(),
  sessionId: input.sessionId,
  createdAt: input.createdAt ?? nowIso(),
  pronunciationFindings: input.pronunciationFindings ?? [],
  grammarFindings: input.grammarFindings ?? [],
  naturalnessFindings: input.naturalnessFindings ?? [],
  extractedExpressionIds: input.extractedExpressionIds ?? [],
});
