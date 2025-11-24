'use client';

import React from 'react';
import { AIModel, AISettings } from '@/services/ai/settings';

interface Props {
    settings: AISettings;
    onUpdateAssignment: (capability: string, modelId: string | null) => void;
    availableModels: {
        language: AIModel[];
        embedding: AIModel[];
        tts: AIModel[];
        stt: AIModel[];
    };
    providers: any[]; // To check for first-party constraint
}

export const ModelAssignmentConfig: React.FC<Props> = ({ settings, onUpdateAssignment, availableModels, providers }) => {

    const renderSelect = (capability: string, label: string, description: string, models: AIModel[], required = false, filter?: (m: AIModel) => boolean) => {
        const filteredModels = filter ? models.filter(filter) : models;
        const currentModelId = settings.assignments[capability as keyof typeof settings.assignments];
        const currentModel = models.find(m => m.id === currentModelId);

        return (
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                    <select
                        value={currentModelId || ''}
                        onChange={(e) => onUpdateAssignment(capability, e.target.value || null)}
                        className="w-full max-w-md border rounded-md p-2 text-sm"
                    >
                        <option value="">Select a model</option>
                        {filteredModels.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                            </option>
                        ))}
                    </select>
                    {currentModelId && (
                        <button onClick={() => onUpdateAssignment(capability, null)} className="text-gray-400 hover:text-red-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
        );
    };

    // Filter for Real-time models (First-party only)
    const isFirstParty = (model: AIModel) => {
        const provider = providers.find(p => p.id === model.provider);
        return provider?.isFirstParty ?? false;
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-4">Default Model Assignments</h2>
                <p className="text-sm text-gray-500 mb-6">Configure which models to use for different purposes across Open Notebook</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {renderSelect('chat', 'Chat Model', 'Used for chat conversations', availableModels.language, true)}
                    {renderSelect('tools', 'Tools Model', 'Used for function calling - OpenAI or Anthropic recommended', availableModels.language)}
                    {renderSelect('embedding', 'Embedding Model', 'Used for semantic search and vector embeddings', availableModels.embedding, true)}
                    {renderSelect('stt', 'Speech-to-Text Model', 'Used for audio transcription', availableModels.stt)}
                    {renderSelect('tts', 'Text-to-Speech Model', 'Used for podcast generation', availableModels.tts)}
                    {/* Realtime is special, needs first party check */}
                    {/* We assume language models can be realtime if they are from first party providers for now, or we could add a specific capability */}
                    {renderSelect('realtime', 'Real-time Model', 'Used for Zen mode (First-party providers only)', availableModels.language, false, isFirstParty)}
                </div>
            </div>
        </div>
    );
};
