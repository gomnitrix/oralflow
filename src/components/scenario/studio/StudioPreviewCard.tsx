import React from "react";
import { ScenarioTemplate } from "../../../domains/scenario/models";

interface StudioPreviewCardProps {
    data: Partial<ScenarioTemplate>;
    onEdit: () => void;
    onRefresh: () => void;
    onSave: () => void;
    onStart: () => void;
}

export const StudioPreviewCard: React.FC<StudioPreviewCardProps> = ({
    data,
    onEdit,
    onRefresh,
    onSave,
    onStart,
}) => {
    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 bg-white rounded-[32px] p-8 shadow-sm border border-custom-border flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold text-custom-text-dark leading-tight">
                        {data.title || "Untitled Scenario"}
                    </h2>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onEdit}
                            className="w-10 h-10 rounded-full bg-custom-bg flex items-center justify-center text-custom-text-dark/60 hover:text-custom-primary hover:bg-custom-primary/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button
                            onClick={onRefresh}
                            className="w-10 h-10 rounded-full bg-custom-bg flex items-center justify-center text-custom-text-dark/60 hover:text-custom-primary hover:bg-custom-primary/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p className="text-custom-text-dark/80 leading-relaxed">
                    {data.description || "Scenario description will appear here..."}
                </p>

                <div className="border-t border-custom-border"></div>

                {/* Characters */}
                <div className="space-y-3">
                    <h3 className="font-bold text-custom-text-dark">Characters</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="bg-custom-bg p-4 rounded-2xl">
                            <p className="font-bold text-sm text-custom-text-dark">Your Role: {data.learnerRole || "..."}</p>
                            <p className="text-sm text-custom-text-dark/60 mt-1">Curious, a little nervous, but excited to try speaking.</p>
                        </div>
                        <div className="bg-custom-bg p-4 rounded-2xl">
                            <p className="font-bold text-sm text-custom-text-dark">Other: {data.aiRole || "..."}</p>
                            <p className="text-sm text-custom-text-dark/60 mt-1">Friendly, patient, and speaks clearly. Might offer a suggestion.</p>
                        </div>
                    </div>
                </div>

                {/* Goals */}
                <div className="space-y-4">
                    <h3 className="font-bold text-custom-text-dark">Dialogue Goals</h3>

                    {/* Main Goal */}
                    {data.mainGoal && (
                        <div className="bg-custom-primary/5 p-4 rounded-2xl border border-custom-primary/10">
                            <p className="text-xs font-bold text-custom-primary uppercase tracking-wider mb-1">Main Goal</p>
                            <p className="text-custom-text-dark font-medium">{data.mainGoal}</p>
                        </div>
                    )}

                    {/* Sub Goals */}
                    <ul className="space-y-3">
                        {data.subGoals && data.subGoals.length > 0 ? (
                            data.subGoals.map((goal, index) => (
                                <li key={index} className="flex items-start gap-3 text-custom-text-dark/80">
                                    <span className="material-symbols-outlined text-custom-primary text-xl shrink-0">check_circle</span>
                                    <span className="leading-tight pt-0.5">{goal}</span>
                                </li>
                            ))
                        ) : (
                            !data.mainGoal && <p className="text-custom-text-dark/40 italic">Goals will be generated...</p>
                        )}
                    </ul>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={onStart}
                    className="w-full rounded-full bg-custom-primary py-4 text-white font-bold text-lg hover:bg-custom-primary/90 transition-colors shadow-lg shadow-custom-primary/20"
                >
                    Accept Scenario & Start Practice
                </button>
                <button
                    onClick={onSave}
                    className="w-full rounded-full bg-transparent py-3 text-custom-text-dark/60 font-bold hover:text-custom-text-dark hover:bg-custom-bg transition-colors"
                >
                    Save to Library
                </button>
            </div>
        </div>
    );
};
