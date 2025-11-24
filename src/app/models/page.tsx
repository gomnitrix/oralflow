'use client';

import React, { useEffect, useState } from 'react';
import { ProviderStatusList } from '@/components/models/ProviderStatusList';
import { ModelCapabilityConfig } from '@/components/models/ModelCapabilityConfig';
import { ModelAssignmentConfig } from '@/components/models/ModelAssignmentConfig';
import { AISettings, AIModel } from '@/services/ai/settings';
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

    const handleUpdateAssignment = async (capability: string, modelId: string | null) => {
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

    const handleAddModel = async (category: string, model: AIModel) => {
        if (!settings) return;

        // Optimistic update
        const newModels = { ...settings.models, [category]: [...settings.models[category as keyof typeof settings.models], model] };
        setSettings({ ...settings, models: newModels });

        await fetch('/api/ai/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'addModel', category, model })
        });
    };

    const handleRemoveModel = async (category: string, modelId: string) => {
        if (!settings) return;

        // Optimistic update
        const newModels = { ...settings.models, [category]: settings.models[category as keyof typeof settings.models].filter(m => m.id !== modelId) };
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

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 pb-20">
            <div>
                <h1 className="text-2xl font-bold mb-2">Model Management</h1>
                <p className="text-gray-600">Configure AI models for different purposes across Open Notebook</p>
            </div>

            <ProviderStatusList />

            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModelCapabilityConfig
                    title="Language Models"
                    description="Chat, transformations, and text generation"
                    category="language"
                    models={settings.models.language}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('language'))}
                />
                <ModelCapabilityConfig
                    title="Embedding Models"
                    description="Semantic search and vector embeddings"
                    category="embedding"
                    models={settings.models.embedding}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('embedding'))}
                />
                <ModelCapabilityConfig
                    title="Text-to-Speech"
                    description="Generate audio from text"
                    category="tts"
                    models={settings.models.tts}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('tts'))}
                />
                <ModelCapabilityConfig
                    title="Speech-to-Text"
                    description="Transcribe audio to text"
                    category="stt"
                    models={settings.models.stt}
                    onAddModel={handleAddModel}
                    onRemoveModel={handleRemoveModel}
                    availableProviders={activeProviders.filter(p => p.capabilities.includes('stt'))}
                />
            </div>

            <hr className="border-gray-200" />

            <ModelAssignmentConfig
                settings={settings}
                onUpdateAssignment={handleUpdateAssignment}
                availableModels={settings.models}
                providers={providers}
            />
        </div>
    );
}
