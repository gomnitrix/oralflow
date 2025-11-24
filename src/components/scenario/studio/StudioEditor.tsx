import React from "react";

interface StudioEditorProps {
    formData: {
        mode: "manual" | "ai" | "import";
        background: string;
        userRole: string;
        agentRole: string;
        goal: string;
        keyword?: string;
        sourceText?: string;
    };
    onChange: (field: string, value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    activeTab: "manual" | "ai" | "import";
    onTabChange: (tab: "manual" | "ai" | "import") => void;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
    formData,
    onChange,
    onGenerate,
    isGenerating,
    activeTab,
    onTabChange,
}) => {
    // const [activeTab, setActiveTab] = React.useState<"manual" | "ai" | "import">("manual"); // Lifted up

    const handleTabChange = (tab: "manual" | "ai" | "import") => {
        onTabChange(tab);
        onChange("mode", tab); // Notify parent of mode change
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-custom-border">
                <button
                    onClick={() => handleTabChange("manual")}
                    className={`pb-3 font-bold transition-colors border-b-2 ${activeTab === "manual"
                        ? "text-custom-primary border-custom-primary"
                        : "text-custom-text-dark/40 border-transparent hover:text-custom-text-dark"
                        }`}
                >
                    Manual Draft
                </button>
                <button
                    onClick={() => handleTabChange("ai")}
                    className={`pb-3 font-bold transition-colors border-b-2 ${activeTab === "ai"
                        ? "text-custom-primary border-custom-primary"
                        : "text-custom-text-dark/40 border-transparent hover:text-custom-text-dark"
                        }`}
                >
                    AI Generate
                </button>
                <button
                    onClick={() => handleTabChange("import")}
                    className={`pb-3 font-bold transition-colors border-b-2 ${activeTab === "import"
                        ? "text-custom-primary border-custom-primary"
                        : "text-custom-text-dark/40 border-transparent hover:text-custom-text-dark"
                        }`}
                >
                    Import Text
                </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6 min-h-[300px]">
                {activeTab === "manual" && (
                    <>
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
                    </>
                )}

                {activeTab === "ai" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-custom-text-dark">
                            Keywords / Topic
                        </label>
                        <textarea
                            value={formData.keyword || ""}
                            onChange={(e) => onChange("keyword", e.target.value)}
                            placeholder="e.g., Job interview for a software engineer position, negotiating a salary..."
                            rows={6}
                            className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                        />
                        <p className="text-xs text-custom-text-dark/60">
                            Enter a few keywords or a short topic, and AI will generate a complete role-play scenario for you.
                        </p>
                    </div>
                )}

                {activeTab === "import" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-custom-text-dark">
                            Source Text
                        </label>
                        <textarea
                            value={formData.sourceText || ""}
                            onChange={(e) => onChange("sourceText", e.target.value)}
                            placeholder="Paste a dialogue, story, or article here..."
                            rows={10}
                            className="w-full rounded-xl border border-custom-border bg-white px-4 py-3 text-custom-text-dark placeholder:text-custom-text-dark/30 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary transition-all resize-none"
                        />
                        <p className="text-xs text-custom-text-dark/60">
                            Paste any text, and AI will extract a relevant role-play scenario from it.
                        </p>
                    </div>
                )}
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
