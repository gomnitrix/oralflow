'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StudioEditor } from "../../../../components/scenario/studio/StudioEditor";
import { StudioPreviewCard } from "../../../../components/scenario/studio/StudioPreviewCard";
import { ScenarioTemplate } from "../../../../domains/scenario/models";
import { ScenarioDetailModal } from "../../../../components/scenario/ScenarioDetailModal";

export default function ScenarioCreatePage() {
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState<{
    mode: "manual" | "ai" | "import";
    background: string;
    userRole: string;
    agentRole: string;
    goal: string;
    keyword: string;
    sourceText: string;
  }>({
    mode: "ai",
    background: "",
    userRole: "",
    agentRole: "",
    goal: "",
    keyword: "",
    sourceText: "",
  });

  // Generated Data State
  const [generatedScenario, setGeneratedScenario] = useState<Partial<ScenarioTemplate> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  // Modal State for "Start Practice"
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "import">("ai");

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/scenarios/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: formData.mode,
          keyword: formData.keyword,
          sourceText: formData.sourceText,
          draft: formData.mode === "manual" ? {
            title: formData.background,
            description: formData.goal, // Using goal as description for now or we could combine
            learnerRole: formData.userRole,
            aiRole: formData.agentRole,
            mainGoal: formData.goal,
          } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate scenario");
      }

      const data = await response.json();
      setGeneratedScenario(data.scenario);
      setIsEditingPreview(false);
    } catch (error) {
      console.error("Generation error:", error);
      // Optional: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleEdit = () => {
    if (!generatedScenario) return;
    setIsEditingPreview((prev) => !prev);
  };

  const handlePreviewUpdate = (next: Partial<ScenarioTemplate>) => {
    setGeneratedScenario((prev) => (prev ? { ...prev, ...next } : next));
  };

  const handleSave = async () => {
    if (!generatedScenario) return;

    try {
      const response = await fetch("/api/scenarios/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedScenario),
      });

      if (!response.ok) {
        throw new Error("Failed to save scenario");
      }

      router.push("/scenarios");
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleStartPractice = () => {
    setShowModeSelection(true);
  };

  const handleStartStw = () => {
    if (generatedScenario?.id) {
      router.push(`/stw?scenarioId=${generatedScenario.id}`);
    }
  };

  const handleStartZen = () => {
    if (generatedScenario?.id) {
      router.push(`/zen?scenarioId=${generatedScenario.id}`);
    }
  };

  return (
    <main className="min-h-screen bg-custom-bg p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header>
          <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Scenario Studio</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Editor */}
          <div className="lg:col-span-7 xl:col-span-7">
            <StudioEditor
              formData={formData}
              onChange={handleFormChange}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5 xl:col-span-5 h-full min-h-[600px]">
            {generatedScenario ? (
              <StudioPreviewCard
                data={generatedScenario}
                isEditing={isEditingPreview}
                onToggleEdit={handleToggleEdit}
                onUpdate={handlePreviewUpdate}
                onRefresh={handleGenerate}
                onSave={handleSave}
                onStart={handleStartPractice}
              />
            ) : (
              <div className="h-full rounded-[32px] border-2 border-dashed border-custom-border bg-white/50 flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="w-20 h-20 rounded-full bg-custom-bg flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-custom-text-dark/20">auto_awesome</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-custom-text-dark/40">Ready to Create</p>
                  <p className="text-custom-text-dark/30">Fill in the details on the left and click Generate.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModeSelection && generatedScenario && (
        <ScenarioDetailModal
          scenario={generatedScenario as ScenarioTemplate}
          onClose={() => setShowModeSelection(false)}
          onStartStw={handleStartStw}
          onStartZen={handleStartZen}
        />
      )}
    </main>
  );
}
