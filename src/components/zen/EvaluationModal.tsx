"use client";

import React from "react";

interface EvaluationData {
    accuracy: number;
    mistakes: {
        id: string;
        type: string;
        correction: string;
    }[];
}

interface EvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    data?: EvaluationData;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    data,
}) => {
    if (!isOpen) return null;

    const { accuracy = 0, mistakes = [] } = data || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 m-4 flex flex-col gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-custom-text-dark">
                        Great work!
                    </h2>
                    <p className="text-custom-text-dark/60 mt-1">
                        Here&apos;s your session summary.
                    </p>
                </div>
                <div className="flex justify-center items-center flex-col gap-2 p-6 bg-custom-bg rounded-lg">
                    <p className="text-sm font-medium text-custom-text-dark/60">
                        Overall Accuracy
                    </p>
                    <p className="text-5xl font-extrabold text-custom-primary">{accuracy}%</p>
                </div>
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-custom-text-dark">
                        Areas to Review
                    </h3>
                    {mistakes.length > 0 ? (
                        <ul className="space-y-3">
                            {mistakes.map((mistake) => (
                                <li key={mistake.id} className="flex items-start gap-3">
                                    <input
                                        className="mt-1 h-5 w-5 rounded border-custom-border text-custom-primary focus:ring-custom-primary"
                                        id={`mistake-${mistake.id}`}
                                        type="checkbox"
                                    />
                                    <label className="flex flex-col" htmlFor={`mistake-${mistake.id}`}>
                                        <span className="font-medium text-custom-text-dark">
                                            {mistake.type}
                                        </span>
                                        <span className="text-sm text-custom-text-dark/60">
                                            {mistake.correction}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-custom-text-dark/60">No mistakes found!</p>
                    )}
                </div>
                <div className="flex gap-3 flex-col sm:flex-row mt-4">
                    <button
                        onClick={onClose}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-custom-bg text-custom-text-dark text-base font-bold leading-normal tracking-[0.015em] hover:bg-custom-bg/80 transition-colors"
                    >
                        <span className="truncate">Close</span>
                    </button>
                    <button
                        onClick={onSave}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-custom-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-custom-primary/90 transition-colors"
                    >
                        <span className="truncate">Save to Notebook</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationModal;
