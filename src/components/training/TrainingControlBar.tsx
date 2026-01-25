import React from "react";
import { Button } from "../shared/Button";

interface TrainingControlBarProps {
  isRecording?: boolean;
  recordEnabled?: boolean;
  onRecord?: () => void;
  onSkip?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
}

export const TrainingControlBar: React.FC<TrainingControlBarProps> = ({
  isRecording = false,
  recordEnabled = true,
  onRecord,
  onSkip,
  onRetry,
  disabled = false,
}) => {
  const recordLabel = recordEnabled ? (isRecording ? "Recording..." : "Record") : "Record (Read Aloud)";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        variant="primary"
        onClick={onRecord}
        className={isRecording ? "bg-custom-accent text-white" : ""}
        disabled={disabled || !recordEnabled}
      >
        {recordLabel}
      </Button>
      <Button variant="secondary" onClick={onRetry} disabled={disabled}>
        Retry
      </Button>
      <Button variant="ghost" onClick={onSkip} disabled={disabled}>
        Skip
      </Button>
    </div>
  );
};
