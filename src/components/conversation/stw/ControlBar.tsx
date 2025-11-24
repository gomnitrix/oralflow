import React from "react";


export type ControlBarStatus = "idle" | "recording" | "review";

interface ControlBarProps {
    status: ControlBarStatus;
    onRecord: () => void;
    onStop: () => void;
    onSend: () => void;
    onRetry: () => void;
    disabled?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    status,
    onRecord,
    onStop,
    onSend,
    onRetry,
    disabled = false,
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[40%] bg-white border-t border-custom-border p-6 flex justify-center items-center z-10">
            {status === "idle" && (
                <button
                    onClick={onRecord}
                    disabled={disabled}
                    className="group flex flex-col items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="w-16 h-16 rounded-full bg-custom-primary flex items-center justify-center shadow-lg group-hover:shadow-custom-primary/30 transition-shadow">
                        <span className="material-symbols-outlined text-white text-3xl">mic</span>
                    </div>
                    <span className="text-sm font-medium text-custom-text-dark/60">Tap to Speak</span>
                </button>
            )}

            {status === "recording" && (
                <button
                    onClick={onStop}
                    className="group flex flex-col items-center gap-2 transition-all hover:scale-105"
                >
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 transition-shadow animate-pulse">
                        <span className="material-symbols-outlined text-white text-3xl">stop</span>
                    </div>
                    <span className="text-sm font-medium text-red-500">Recording...</span>
                </button>
            )}

            {status === "review" && (
                <div className="flex items-center gap-6">
                    <button
                        onClick={onRetry}
                        disabled={disabled}
                        className="flex flex-col items-center gap-2 group transition-all disabled:opacity-50"
                    >
                        <div className="w-12 h-12 rounded-full bg-custom-bg border border-custom-border flex items-center justify-center group-hover:bg-custom-border/50 transition-colors">
                            <span className="material-symbols-outlined text-custom-text-dark text-xl">refresh</span>
                        </div>
                        <span className="text-xs font-medium text-custom-text-dark/60">Retry</span>
                    </button>

                    <button
                        onClick={onSend}
                        disabled={disabled}
                        className="flex flex-col items-center gap-2 group transition-all hover:scale-105 disabled:opacity-50"
                    >
                        <div className="w-16 h-16 rounded-full bg-custom-primary flex items-center justify-center shadow-lg group-hover:shadow-custom-primary/30 transition-shadow">
                            <span className="material-symbols-outlined text-white text-3xl">send</span>
                        </div>
                        <span className="text-sm font-medium text-custom-primary">Send</span>
                    </button>
                </div>
            )}
        </div>
    );
};
