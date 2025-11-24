'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ScenarioCard } from "../../../components/scenario/ScenarioCard";
import { ScenarioDetailModal } from "../../../components/scenario/ScenarioDetailModal";
import { ScenarioTemplate } from "../../../domains/scenario/models";

interface ScenarioLibraryClientProps {
    initialScenarios: ScenarioTemplate[];
}

export function ScenarioLibraryClient({ initialScenarios }: ScenarioLibraryClientProps) {
    const router = useRouter();
    const [scenarios, setScenarios] = useState<ScenarioTemplate[]>(initialScenarios);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null);

    const handleStartStw = () => {
        if (selectedScenario) {
            router.push(`/stw?scenarioId=${selectedScenario.id}`);
        }
    };

    const handleStartZen = () => {
        if (selectedScenario) {
            router.push(`/zen?scenarioId=${selectedScenario.id}`);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent opening the modal
        if (!confirm("Are you sure you want to delete this scenario?")) return;

        try {
            const response = await fetch(`/api/scenarios/crud?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");

            setScenarios((prev) => prev.filter((s) => s.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete scenario.");
        }
    };

    return (
        <main className="p-8 lg:p-12 space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Scenario Library</h1>
                    <p className="text-custom-text-dark/60 text-base font-normal leading-normal">Browse and launch practice scenarios.</p>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {scenarios.map((scenario) => (
                    <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        onClick={() => setSelectedScenario(scenario)}
                        onDelete={(e) => handleDelete(e, scenario.id)}
                    />
                ))}
            </div>

            {selectedScenario && (
                <ScenarioDetailModal
                    scenario={selectedScenario}
                    onClose={() => setSelectedScenario(null)}
                    onStartStw={handleStartStw}
                    onStartZen={handleStartZen}
                />
            )}
        </main>
    );
}
