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

    return (
        <main className="p-8 lg:p-12 space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-custom-text-dark text-4xl font-black leading-tight tracking-tighter">Scenario Library</h1>
                    <p className="text-custom-text-dark/60 text-base font-normal leading-normal">Browse and launch practice scenarios.</p>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {initialScenarios.map((scenario) => (
                    <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        onClick={() => setSelectedScenario(scenario)}
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
