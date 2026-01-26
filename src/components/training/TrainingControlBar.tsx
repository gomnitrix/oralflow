import React from "react";
import { Button } from "../shared/Button";

interface TrainingControlBarProps {
  status: "idle" | "recording" | "review";
  onRecord?: () => void;
  onStop?: () => void;
  onRetry?: () => void;
  onSend?: () => void;
  onSkip?: () => void;
  disabled?: boolean;
  sendLabel?: string;
}

export const TrainingControlBar: React.FC<TrainingControlBarProps> = ({
  status,
  onRecord,
  onStop,
  onSkip,
  onRetry,
  onSend,
  disabled = false,
  sendLabel = "Send",
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {status === "idle" && (
        <Button variant="primary" onClick={onRecord} disabled={disabled}>
          Record
        </Button>
      )}

      {status === "recording" && (
        <Button
          variant="secondary"
          onClick={onStop}
          disabled={disabled}
          className="bg-red-50 text-red-600 border-red-200"
        >
          Stop
        </Button>
      )}

      {status === "review" && (
        <>
          <Button variant="secondary" onClick={onRetry} disabled={disabled}>
            Retry
          </Button>
          <Button variant="primary" onClick={onSend} disabled={disabled}>
            {sendLabel}
          </Button>
        </>
      )}

      <Button variant="ghost" onClick={onSkip} disabled={disabled || status === "recording"}>
        Skip
      </Button>
    </div>
  );
};
