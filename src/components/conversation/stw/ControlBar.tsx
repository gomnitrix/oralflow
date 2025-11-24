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
        <div className="w-full p-8 flex justify-center items-center z-10 pointer-events-none">
            <div className="pointer-events-auto bg-white/90 backdrop-blur-md shadow-2xl shadow-black/5 border border-custom-border/50 rounded-full px-8 py-4 flex items-center gap-8 transition-all hover:shadow-xl hover:scale-[1.02]">
                {status === "idle" && (
                    <button
                        onClick={onRecord}
                        disabled={disabled}
                        className="group flex items-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-14 h-14 rounded-full bg-custom-primary flex items-center justify-center shadow-lg shadow-custom-primary/30 group-hover:scale-110 transition-all">
                            <span className="material-symbols-outlined text-white text-3xl">mic</span>
                        </div>
                        <span className="text-lg font-bold text-custom-text-dark pr-2">Tap to Speak</span>
                    </button>
                )}

                {status === "recording" && (
                    <button
                        onClick={onStop}
                        className="group flex items-center gap-4 transition-all"
                    >
                        <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-all animate-pulse">
                            <span className="material-symbols-outlined text-white text-3xl">stop</span>
                        </div>
                        <span className="text-lg font-bold text-red-500 pr-2">Recording...</span>
                    </button>
                )}

                {status === "review" && (
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onRetry}
                            disabled={disabled}
                            className="flex items-center gap-2 group transition-all disabled:opacity-50 px-4 py-2 rounded-full hover:bg-gray-100"
                        >
                            <span className="material-symbols-outlined text-custom-text-dark text-2xl group-hover:-rotate-180 transition-transform duration-500">refresh</span>
                            <span className="text-sm font-bold text-custom-text-dark">Retry</span>
                        </button>

                        <div className="w-px h-8 bg-custom-border"></div>

                        <button
                            onClick={onSend}
                            disabled={disabled}
                            className="flex items-center gap-3 group transition-all disabled:opacity-50 pl-2"
                        >
                            <span className="text-lg font-bold text-custom-primary">Send</span>
                            <div className="w-12 h-12 rounded-full bg-custom-primary flex items-center justify-center shadow-lg shadow-custom-primary/30 group-hover:scale-110 group-hover:translate-x-1 transition-all">
                                <span className="material-symbols-outlined text-white text-2xl">send</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
