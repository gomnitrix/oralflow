'use client';

import React from 'react';
import { AIModel, AISettings, type AssignmentCapability } from '@/services/ai/settings';

interface Props {
    settings: AISettings;
    onUpdateAssignment: (capability: AssignmentCapability, modelId: string | null) => void;
    availableModels: AISettings['models'];
}

export const ModelAssignmentConfig: React.FC<Props> = ({ settings, onUpdateAssignment, availableModels }) => {
    const renderSelect = (
        capability: AssignmentCapability,
        label: string,
        description: string,
        models: AIModel[],
        required = false,
        filter?: (m: AIModel) => boolean
    ) => {
        const filteredModels = filter ? models.filter(filter) : models;
        const currentModelId = settings.assignments[capability];

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

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-lg font-semibold mb-4">Zen Mode</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {renderSelect('zen_realtime', 'Real-time Model', 'Used for Zen mode (First-party providers only)', availableModels.realtime_speech, false)}
                    {renderSelect('zen_goal', 'Goal Completion', 'Assess completion of goals from conversation', availableModels.language)}
                </div>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h2 className="text-lg font-semibold mb-4">STW Mode</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {renderSelect('stw_chat', 'Chat Model', 'Main conversation model', availableModels.language, true)}
                    {renderSelect('stw_stt', 'Speech-to-Text', 'Transcribe user audio', availableModels.stt, true)}
                    {renderSelect('stw_tts', 'Text-to-Speech', 'Generate AI voice', availableModels.tts, true)}
                    {renderSelect('stw_assessment_text', 'Assessment (Text Analysis)', 'Analyze user text for suggestions', availableModels.language)}
                    {renderSelect('stw_goal', 'Goal Completion', 'Evaluate which goals are completed', availableModels.language)}
                </div>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h2 className="text-lg font-semibold mb-4">Copilot</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {renderSelect('copilot_distill', 'Distill Model', 'Summarize and extract insights', availableModels.language)}
                    {renderSelect('copilot_inspiration', 'Inspiration Burst', 'Generate creative ideas', availableModels.language)}
                </div>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h2 className="text-lg font-semibold mb-4">Notebook</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {renderSelect('notebook_tts', 'Phrase Pronunciation', 'Read saved phrases aloud', availableModels.tts)}
                </div>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h2 className="text-lg font-semibold mb-4">Other Scenarios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {renderSelect('scenario_draft', 'Scenario Draft', 'Generate scenario drafts', availableModels.language)}
                    {renderSelect('ask_ai', 'Ask AI', 'General Q&A', availableModels.language)}
                    {renderSelect('review_notes', 'Review Notes', 'Format and organize notes', availableModels.language)}
                    {renderSelect('free_chat_draft', 'Free Chat Draft', 'Translate/contextualize free chat text', availableModels.language)}
                </div>
            </div>
        </div>
    );
};
