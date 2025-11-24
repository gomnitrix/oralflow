import React from "react";

interface StudioEditorProps {
    formData: {
        background: string;
        userRole: string;
        agentRole: string;
        goal: string;
    };
    onChange: (field: string, value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
    formData,
    onChange,
    onGenerate,
    isGenerating,
}) => {
    return (
        <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-custom-border">
                <button className="pb-3 text-custom-primary font-bold border-b-2 border-custom-primary">
                    Manual Draft
                </button>
                <button className="pb-3 text-custom-text-dark/40 font-medium hover:text-custom-text-dark transition-colors">
                    AI Generate
                </button>
                <button className="pb-3 text-custom-text-dark/40 font-medium hover:text-custom-text-dark transition-colors">
                    Import Text
                </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-custom-text-dark">
                        Background
                    </label>
                    <input
                        type="text"
                        value={formData.background}
                        onChange={(e) => onChange("background", e.target.value)}
                        placeholder="e.g., A cozy café in Paris"
                        className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-custom-text-dark">
                            Your Role
                        </label>
                        <input
                            type="text"
                            value={formData.userRole}
                            onChange={(e) => onChange("userRole", e.target.value)}
                            placeholder="e.g., A tourist"
                            className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-custom-text-dark">
                            Other Character&apos;s Role
                        </label>
                        <input
                            type="text"
                            value={formData.agentRole}
                            onChange={(e) => onChange("agentRole", e.target.value)}
                            placeholder="e.g., A friendly barista"
                            className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-custom-text-dark">
                        Your Goal
                    </label>
                    <textarea
                        value={formData.goal}
                        onChange={(e) => onChange("goal", e.target.value)}
                        placeholder="e.g., Successfully order a croissant and a café au lait."
                        rows={4}
                        className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                    />
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full rounded-full bg-custom-primary py-4 text-white font-bold text-lg hover:bg-custom-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-custom-primary/20"
            >
                {isGenerating ? (
                    <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Generating...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Generate Scenario
                    </>
                )}
            </button>
        </div>
    );
};
