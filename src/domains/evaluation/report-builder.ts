import {
  createSessionEvaluationReport,
  type EvaluationRecord,
  type SessionEvaluationReport,
} from "../conversation/models";

export interface ReportContext {
  sessionId: string;
  evaluationRecords: EvaluationRecord[];
}

export const buildSessionReport = (ctx: ReportContext): SessionEvaluationReport => {
  const pronunciationFindings: string[] = [];
  const grammarFindings: string[] = [];
  const naturalnessFindings: string[] = [];

  ctx.evaluationRecords.forEach((record) => {
    pronunciationFindings.push(...record.pronunciationIssues);
    grammarFindings.push(...record.grammarIssues);
    naturalnessFindings.push(...record.naturalnessNotes);
  });

  return createSessionEvaluationReport({
    sessionId: ctx.sessionId,
    pronunciationFindings,
    grammarFindings,
    naturalnessFindings,
    extractedExpressionIds: [],
  });
};
