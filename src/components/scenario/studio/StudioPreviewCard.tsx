import React from "react";
import { ScenarioTemplate } from "../../../domains/scenario/models";

interface StudioPreviewCardProps {
    data: Partial<ScenarioTemplate>;
    isEditing?: boolean;
    onToggleEdit: () => void;
    onUpdate: (next: Partial<ScenarioTemplate>) => void;
    onRefresh: () => void;
    onSave: () => void;
    onStart: () => void;
}

export const StudioPreviewCard: React.FC<StudioPreviewCardProps> = ({
    data,
    isEditing = false,
    onToggleEdit,
    onUpdate,
    onRefresh,
    onSave,
    onStart,
}) => {
    const subGoalsValue = (data.subGoals ?? []).join("\n");
    const updateSubGoals = (value: string) => {
        const next = value
            .split("\n")
            .map((goal) => goal.trim())
            .filter(Boolean);
        onUpdate({ subGoals: next });
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 bg-white rounded-[32px] p-8 shadow-sm border border-custom-border flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    {isEditing ? (
                        <input
                            type="text"
                            value={data.title ?? ""}
                            onChange={(event) => onUpdate({ title: event.target.value })}
                            placeholder="Untitled Scenario"
                            className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all text-2xl font-bold leading-tight"
                        />
                    ) : (
                        <h2 className="text-2xl font-bold text-custom-text-dark leading-tight">
                            {data.title || "Untitled Scenario"}
                        </h2>
                    )}
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onToggleEdit}
                            className="w-10 h-10 rounded-full bg-custom-bg flex items-center justify-center text-custom-text-dark/60 hover:text-custom-primary hover:bg-custom-primary/10 transition-colors"
                            aria-label={isEditing ? "Finish editing" : "Edit scenario"}
                        >
                            <span className="material-symbols-outlined text-xl">{isEditing ? "check" : "edit"}</span>
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
                {isEditing ? (
                    <textarea
                        value={data.description ?? ""}
                        onChange={(event) => onUpdate({ description: event.target.value })}
                        placeholder="Scenario description will appear here..."
                        rows={4}
                        className="w-full rounded-2xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                    />
                ) : (
                    <p className="text-custom-text-dark/80 leading-relaxed">
                        {data.description || "Scenario description will appear here..."}
                    </p>
                )}

                <div className="border-t border-custom-border"></div>

                {/* Characters */}
                <div className="space-y-3">
                    <h3 className="font-bold text-custom-text-dark">Characters</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="bg-custom-bg p-4 rounded-2xl">
                            <p className="text-xs font-bold text-custom-primary uppercase tracking-wider">Your Role</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={data.learnerRole ?? ""}
                                    onChange={(event) => onUpdate({ learnerRole: event.target.value })}
                                    placeholder="Your role"
                                    className="mt-2 w-full rounded-xl border border-custom-border bg-white px-3 py-2 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                                />
                            ) : (
                                <p className="mt-2 font-semibold text-custom-text-dark">{data.learnerRole || "..."}</p>
                            )}
                            <p className="text-xs text-custom-text-dark/60 mt-2">
                                Curious, a little nervous, but excited to try speaking.
                            </p>
                        </div>
                        <div className="bg-custom-bg p-4 rounded-2xl">
                            <p className="text-xs font-bold text-custom-primary uppercase tracking-wider">AI Role</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={data.aiRole ?? ""}
                                    onChange={(event) => onUpdate({ aiRole: event.target.value })}
                                    placeholder="AI role"
                                    className="mt-2 w-full rounded-xl border border-custom-border bg-white px-3 py-2 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                                />
                            ) : (
                                <p className="mt-2 font-semibold text-custom-text-dark">{data.aiRole || "..."}</p>
                            )}
                            <p className="text-xs text-custom-text-dark/60 mt-2">
                                Friendly, patient, and speaks clearly. Might offer a suggestion.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Goals */}
                <div className="space-y-4">
                    <h3 className="font-bold text-custom-text-dark">Dialogue Goals</h3>

                    {/* Main Goal */}
                    {(isEditing || data.mainGoal) && (
                        <div className="bg-custom-primary/5 p-4 rounded-2xl border border-custom-primary/10">
                            <p className="text-xs font-bold text-custom-primary uppercase tracking-wider mb-1">Main Goal</p>
                            {isEditing ? (
                                <textarea
                                    value={data.mainGoal ?? ""}
                                    onChange={(event) => onUpdate({ mainGoal: event.target.value })}
                                    placeholder="Main goal"
                                    rows={3}
                                    className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                                />
                            ) : (
                                <p className="text-custom-text-dark font-medium">{data.mainGoal}</p>
                            )}
                        </div>
                    )}

                    {/* Sub Goals */}
                    {isEditing ? (
                        <div className="bg-custom-bg p-4 rounded-2xl border border-custom-border">
                            <p className="text-xs font-bold text-custom-text-dark/60 uppercase tracking-wider mb-2">Sub Goals</p>
                            <textarea
                                value={subGoalsValue}
                                onChange={(event) => updateSubGoals(event.target.value)}
                                placeholder="Add one sub goal per line"
                                rows={4}
                                className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                            />
                        </div>
                    ) : (
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
                    )}
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
