import React from "react";
import { Button } from "../shared/Button";

interface TrainingControlBarProps {
  isRecording?: boolean;
  onRecord?: () => void;
  onSkip?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
}

export const TrainingControlBar: React.FC<TrainingControlBarProps> = ({
  isRecording = false,
  onRecord,
  onSkip,
  onRetry,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        variant="primary"
        onClick={onRecord}
        className={isRecording ? "bg-custom-accent text-white" : ""}
        disabled={disabled}
      >
        {isRecording ? "Recording..." : "Record"}
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
