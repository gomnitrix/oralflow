import React, { useEffect } from "react";
import confetti from "canvas-confetti";

export interface SessionScores {
    accuracy: number;
    fluency: number;
    prosody: number;
    completeness: number;
    pronunciation: number;
    overall: number;
}

interface SessionSummaryModalProps {
    isOpen: boolean;
    scores: SessionScores | null;
    onHome: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
    isOpen,
    scores,
    onHome,
}) => {
    useEffect(() => {
        if (isOpen) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const hasScores = scores !== null;
    const isHighScore = hasScores && scores.overall >= 80;
    const imageSrc = isHighScore ? "/images/cheers.png" : "/images/try-next-time.png";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-xl p-4 animate-in zoom-in-95 duration-300">
                <div className="flex w-full flex-col items-center gap-6 rounded-3xl bg-[#f8f6f6] p-6 sm:p-8 md:p-10 shadow-2xl border border-white/20">
                    <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative h-40 w-40 flex-shrink-0">
                            <img
                                alt={isHighScore ? "Cheers!" : "Keep trying!"}
                                className="h-full w-full object-contain mix-blend-multiply"
                                src={imageSrc}
                            />
                        </div>
                        <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-custom-primary/10 p-6 sm:items-start w-full sm:w-auto">
                            <p className="text-custom-text-dark text-base font-medium leading-normal">
                                {hasScores ? "Overall Speaking Quality" : "Assessment Unavailable"}
                            </p>
                            <p className="text-custom-primary tracking-tight text-5xl font-bold leading-tight">
                                {hasScores ? `${Math.round(scores.overall)}%` : "--"}
                            </p>
                        </div>
                    </div>

                    <div className="w-full">
                        {hasScores ? (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <ScoreBar label="Accuracy" value={scores.accuracy} />
                                <ScoreBar label="Fluency" value={scores.fluency} />
                                <ScoreBar label="Prosody" value={scores.prosody} />
                                <ScoreBar label="Completeness" value={scores.completeness} />
                                <div className="sm:col-span-2">
                                    <ScoreBar label="Pronunciation" value={scores.pronunciation} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                                <span className="material-symbols-outlined text-4xl text-custom-text-dark/20">mic_off</span>
                                <p className="text-custom-text-dark/60 text-sm">
                                    No speech detected in this session. <br />
                                    Speak up next time to get your personalized assessment!
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex w-full pt-4">
                        <button
                            onClick={onHome}
                            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-custom-primary text-base font-bold text-white transition-all hover:bg-custom-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <p className="text-custom-text-dark text-base font-medium leading-normal">{label}</p>
            <p className="text-custom-primary text-sm font-bold leading-normal">{Math.round(value)}%</p>
        </div>
        <div className="h-2 w-full rounded-full bg-[#e5dedc]">
            <div
                className="h-2 rounded-full bg-custom-primary transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    </div>
);
