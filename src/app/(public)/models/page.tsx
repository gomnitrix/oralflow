'use client';

import React, { useEffect, useState } from 'react';
import { ProviderStatusList } from '@/components/models/ProviderStatusList';
import { ModelCapabilityConfig } from '@/components/models/ModelCapabilityConfig';
import { ModelAssignmentConfig } from '@/components/models/ModelAssignmentConfig';
import { AISettings, AIModel, type AssignmentCapability } from '@/services/ai/settings';
import { AIProvider } from '@/services/ai/provider-manager';

export default function ModelsPage() {
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [settingsRes, providersRes] = await Promise.all([
                fetch('/api/ai/settings'),
                fetch('/api/ai/providers')
            ]);
            const settingsData = await settingsRes.json();
            const providersData = await providersRes.json();
            setSettings(settingsData);
            setProviders(providersData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateAssignment = async (capability: AssignmentCapability, modelId: string | null) => {
        if (!settings) return;

        const newAssignments = { ...settings.assignments, [capability]: modelId };
        // Optimistic update
        setSettings({ ...settings, assignments: newAssignments });

        await fetch('/api/ai/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'assignment', data: { [capability]: modelId } })
        });
    };

    const handleAddModel = async (category: keyof AISettings['models'], model: AIModel) => {
        if (!settings) return;

        // Optimistic update
        const newModels = { ...settings.models, [category]: [...settings.models[category], model] };
        setSettings({ ...settings, models: newModels });

        await fetch('/api/ai/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'addModel', category, model })
        });
    };

    const handleRemoveModel = async (category: keyof AISettings['models'], modelId: string) => {
        if (!settings) return;

        // Optimistic update
        const newModels = { ...settings.models, [category]: settings.models[category].filter(m => m.id !== modelId) };
        setSettings({ ...settings, models: newModels });

        await fetch('/api/ai/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'removeModel', category, modelId })
        });
    };

    if (loading || !settings) {
        return <div className="p-8">Loading...</div>;
    }

    const activeProviders = providers.filter(p => p.isActive);

    if (!settings) return <div>Loading...</div>;

    // Filter models based on active providers
    const activeProviderIds = activeProviders.map(p => p.id);
    const filteredModels = {
        language: settings.models.language.filter(m => activeProviderIds.includes(m.provider as any)),
        tts: settings.models.tts.filter(m => activeProviderIds.includes(m.provider as any)),
        stt: settings.models.stt.filter(m => activeProviderIds.includes(m.provider as any)),
        speech_to_speech: settings.models.speech_to_speech.filter(m => activeProviderIds.includes(m.provider as any)),
        realtime_speech: settings.models.realtime_speech.filter(m => activeProviderIds.includes(m.provider as any)),
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold mb-6">AI Models</h1>

            <ProviderStatusList />

            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModelCapabilityConfig
                    title="Language Models"
                    description="Chat, transformations, and text generation"
                    category="language"
                    models={filteredModels.language}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('language'))}
                />
                <ModelCapabilityConfig
                    title="Real-time Speech Models"
                    description="Low-latency models for Zen Mode (First-party only)"
                    category="realtime_speech"
                    models={filteredModels.realtime_speech}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('realtime_speech'))}
                />
                <ModelCapabilityConfig
                    title="Speech-to-Speech"
                    description="Voice conversation models"
                    category="speech_to_speech"
                    models={filteredModels.speech_to_speech}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders}
                />
                <ModelCapabilityConfig
                    title="Text-to-Speech"
                    description="Generate audio from text"
                    category="tts"
                    models={filteredModels.tts}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('tts'))}
                />
                <ModelCapabilityConfig
                    title="Speech-to-Text"
                    description="Transcribe audio to text"
                    category="stt"
                    models={filteredModels.stt}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('stt'))}
                />
            </div>

            <hr className="border-gray-200" />

            <ModelAssignmentConfig
                settings={settings}
                onUpdateAssignment={handleUpdateAssignment}
                availableModels={filteredModels}
                providers={providers}
            />
        </div>
    );
}
