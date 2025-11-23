import React from "react";
import type { SessionEvaluationReport } from "../../../domains/conversation/models";
import { Button } from "../../shared/Button";

export interface ZenReportPanelProps {
  report?: SessionEvaluationReport | null;
  onSaveNotebook?: () => void;
  onDownload?: () => void;
}

export const ZenReportPanel: React.FC<ZenReportPanelProps> = ({
  report,
  onSaveNotebook,
  onDownload,
}) => {
  if (!report) {
    return (
      <div className="rounded-2xl bg-surface-card p-4 text-white">
        <p className="text-sm text-white/70">Report will appear after session ends.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-card p-4 text-white space-y-3 shadow-card">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">Zen Report</p>
          <h3 className="text-lg font-semibold">Session Summary</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDownload}>
            Download
          </Button>
          <Button variant="primary" onClick={onSaveNotebook}>
            Save Expressions
          </Button>
        </div>
      </header>

      <div className="space-y-2 text-sm">
        <p className="text-white/80">Pronunciation: {report.pronunciationFindings.join("; ") || "N/A"}</p>
        <p className="text-white/80">Grammar: {report.grammarFindings.join("; ") || "N/A"}</p>
        <p className="text-white/80">Naturalness: {report.naturalnessFindings.join("; ") || "N/A"}</p>
      </div>
    </div>
  );
};
