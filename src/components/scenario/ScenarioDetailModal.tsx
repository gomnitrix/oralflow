import React from "react";
import { ScenarioTemplate } from "../../domains/scenario/models";
import { Button } from "../shared/Button";

interface ScenarioDetailModalProps {
    scenario: ScenarioTemplate;
    onClose: () => void;
    onStartStw: () => void;
    onStartZen: () => void;
}

export const ScenarioDetailModal: React.FC<ScenarioDetailModalProps> = ({
    scenario,
    onClose,
    onStartStw,
    onStartZen,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-custom-bg p-8 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 rounded-full p-2 hover:bg-black/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-custom-text-dark">close</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Scenario Details */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{scenario.emoji}</span>
                                <h3 className="text-2xl font-bold text-custom-text-dark">{scenario.title}</h3>
                            </div>
                            <p className="text-custom-text-dark/80 text-base leading-relaxed">
                                {scenario.description}
                            </p>
                        </div>

                        <div className="border-t border-custom-border my-2"></div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <h4 className="font-bold text-custom-text-dark pb-2">Characters</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-custom-primary/5 p-4 rounded-lg">
                                        <p className="font-semibold text-sm text-custom-text-dark">Your Role: {scenario.learnerRole}</p>
                                        <p className="text-sm text-custom-text-dark/70 mt-1">Curious, a little nervous, but excited.</p>
                                    </div>
                                    <div className="bg-custom-primary/5 p-4 rounded-lg">
                                        <p className="font-semibold text-sm text-custom-text-dark">Other: {scenario.aiRole}</p>
                                        <p className="text-sm text-custom-text-dark/70 mt-1">Friendly, patient, and speaks clearly.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-custom-text-dark pb-2">Dialogue Goals</h4>
                                <ul className="flex flex-col gap-2">
                                    {scenario.mainGoal && (
                                        <li className="flex items-start gap-2 text-custom-text-dark/80 font-medium">
                                            <span className="material-symbols-outlined text-custom-primary text-lg shrink-0 mt-0.5">flag</span>
                                            {scenario.mainGoal}
                                        </li>
                                    )}
                                    {scenario.subGoals && scenario.subGoals.length > 0 ? (
                                        scenario.subGoals.map((goal, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-custom-text-dark/80">
                                                <span className="material-symbols-outlined text-custom-primary text-lg shrink-0 mt-0.5">check_circle</span>
                                                {goal}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-custom-text-dark/60 italic">No specific goals listed.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Action Area */}
                    <div className="flex flex-col justify-center gap-6 border-t lg:border-t-0 lg:border-l border-custom-border pt-6 lg:pt-0 lg:pl-8">
                        <p className="text-xl font-bold text-center text-custom-text-dark mb-2">Choose a practice mode</p>

                        <button
                            onClick={onStartStw}
                            className="group flex flex-col items-center text-center p-6 rounded-xl bg-white border-2 border-custom-border hover:border-custom-primary hover:shadow-lg transition-all"
                        >
                            <span className="material-symbols-outlined text-custom-primary text-4xl mb-3 group-hover:scale-110 transition-transform">pause_circle</span>
                            <p className="font-bold text-lg text-custom-text-dark">Stop the World Mode</p>
                            <p className="text-sm mt-2 text-custom-text-dark/70">Take your time. The AI waits for you to finish speaking.</p>
                        </button>

                        <button
                            onClick={onStartZen}
                            className="group flex flex-col items-center text-center p-6 rounded-xl bg-white border-2 border-custom-border hover:border-custom-primary hover:shadow-lg transition-all"
                        >
                            <span className="material-symbols-outlined text-custom-primary text-4xl mb-3 group-hover:scale-110 transition-transform">waves</span>
                            <p className="font-bold text-lg text-custom-text-dark">Zen Mode</p>
                            <p className="text-sm mt-2 text-custom-text-dark/70">A seamless, real-time conversation flow without interruptions.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
