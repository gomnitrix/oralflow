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
  const [formData, setFormData] = useState({
    background: "",
    userRole: "",
    agentRole: "",
    goal: "",
  });

  // Generated Data State
  const [generatedScenario, setGeneratedScenario] = useState<Partial<ScenarioTemplate> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal State for "Start Practice"
  const [showModeSelection, setShowModeSelection] = useState(false);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Mock AI Generation Delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock Generated Data based on inputs
    const mockGenerated: Partial<ScenarioTemplate> = {
      id: `gen_${Date.now()}`,
      title: formData.background ? `Scenario at ${formData.background}` : "Custom Scenario",
      description: `You are a ${formData.userRole || "person"} interacting with a ${formData.agentRole || "person"} at ${formData.background || "a location"}. ${formData.goal}`,
      emoji: "✨",
      learnerRole: formData.userRole || "Learner",
      aiRole: formData.agentRole || "Agent",
      subGoals: [
        "Greet the other person politely.",
        "Ask a relevant question.",
        "Respond to an inquiry.",
        "Close the conversation naturally."
      ],
      preferredMode: "zen",
    };

    setGeneratedScenario(mockGenerated);
    setIsGenerating(false);
  };

  const handleEdit = () => {
    if (generatedScenario) {
      // Populate form with generated data (simplified for now)
      // In a real app, we might want to parse the description back or keep separate state
      // For now, we just keep the form as is, assuming the user wants to tweak inputs
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = () => {
    // Mock Save
    console.log("Saving scenario:", generatedScenario);
    router.push("/scenarios");
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
          <div className="lg:col-span-5 xl:col-span-4">
            <StudioEditor
              formData={formData}
              onChange={handleFormChange}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7 xl:col-span-8 h-full min-h-[600px]">
            {generatedScenario ? (
              <StudioPreviewCard
                data={generatedScenario}
                onEdit={handleEdit}
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
