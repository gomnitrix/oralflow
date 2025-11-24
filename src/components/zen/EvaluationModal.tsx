"use client";

import React from "react";

interface EvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-background-light dark:bg-background-dark rounded-xl shadow-2xl p-8 m-4 flex flex-col gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#181311] dark:text-gray-100">
                        Great work!
                    </h2>
                    <p className="text-[#896b61] dark:text-gray-400 mt-1">
                        Here&apos;s your session summary.
                    </p>
                </div>
                <div className="flex justify-center items-center flex-col gap-2 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-medium text-[#896b61] dark:text-gray-400">
                        Overall Accuracy
                    </p>
                    <p className="text-5xl font-extrabold text-primary">87%</p>
                </div>
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-[#181311] dark:text-gray-100">
                        Areas to Review
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <input
                                className="mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-700 dark:checked:bg-primary"
                                id="mistake1"
                                type="checkbox"
                            />
                            <label className="flex flex-col" htmlFor="mistake1">
                                <span className="font-medium text-[#181311] dark:text-gray-200">
                                    Incorrect verb tense
                                </span>
                                <span className="text-sm text-[#896b61] dark:text-gray-400">
                                    &quot;I have went&quot; should be &quot;I have gone&quot;.
                                </span>
                            </label>
                        </li>
                        <li className="flex items-start gap-3">
                            <input
                                className="mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-700 dark:checked:bg-primary"
                                id="mistake2"
                                type="checkbox"
                            />
                            <label className="flex flex-col" htmlFor="mistake2">
                                <span className="font-medium text-[#181311] dark:text-gray-200">
                                    Article usage
                                </span>
                                <span className="text-sm text-[#896b61] dark:text-gray-400">
                                    &quot;I would like a coffee&quot; instead of &quot;I would like coffee&quot;.
                                </span>
                            </label>
                        </li>
                        <li className="flex items-start gap-3">
                            <input
                                className="mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-700 dark:checked:bg-primary"
                                id="mistake3"
                                type="checkbox"
                            />
                            <label className="flex flex-col" htmlFor="mistake3">
                                <span className="font-medium text-[#181311] dark:text-gray-200">
                                    Pronunciation of &quot;Espresso&quot;
                                </span>
                                <span className="text-sm text-[#896b61] dark:text-gray-400">
                                    Emphasize the &apos;s&apos; sound.
                                </span>
                            </label>
                        </li>
                    </ul>
                </div>
                <div className="flex gap-3 flex-col sm:flex-row mt-4">
                    <button
                        onClick={onClose}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-[#f4f1f0] dark:bg-gray-700 text-[#181311] dark:text-gray-100 text-base font-bold leading-normal tracking-[0.015em]"
                    >
                        <span className="truncate">Close</span>
                    </button>
                    <button
                        onClick={onSave}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em]"
                    >
                        <span className="truncate">Save to Notebook</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationModal;
