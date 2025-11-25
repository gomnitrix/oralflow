'use client';

import React, { useState } from 'react';
import { AIModel, type AISettings } from '@/services/ai/settings';

interface Props {
    title: string;
    description: string;
    category: keyof AISettings['models'];
    models: AIModel[];
    onAddModel: (category: keyof AISettings['models'], model: AIModel) => void;
    onRemoveModel: (category: keyof AISettings['models'], modelId: string) => void;
    availableProviders: { id: string; name: string }[];
}

export const ModelCapabilityConfig: React.FC<Props> = ({ title, description, category, models, onAddModel, onRemoveModel, availableProviders }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newModelName, setNewModelName] = useState('');
    const [selectedProvider, setSelectedProvider] = useState('');

    const handleAdd = () => {
        if (newModelName && selectedProvider) {
            onAddModel(category, {
                id: newModelName, // Using name as ID for simplicity in this context
                name: newModelName,
                provider: selectedProvider,
                capabilities: [category]
            });
            setIsAdding(false);
            setNewModelName('');
            setSelectedProvider('');
        }
    };

    return (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        {/* Icon placeholder based on category */}
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            {category === 'language' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                            {category === 'realtime_speech' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            {category === 'tts' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
                            {category === 'stt' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                        </div>
                        <h3 className="font-semibold text-lg">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Model
                </button>
            </div>

            <div className="space-y-2">
                {models.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No models configured</div>
                ) : (
                    models.map(model => (
                        <div key={model.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">{model.name}</span>
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{model.provider}</span>
                            </div>
                            {/* Only allow removing if it's not a system default? For now allow all since we persist user config */}
                            <button onClick={() => onRemoveModel(category, model.id)} className="text-gray-400 hover:text-red-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add {title}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                                <select
                                    value={selectedProvider}
                                    onChange={e => setSelectedProvider(e.target.value)}
                                    className="w-full border rounded-md p-2"
                                >
                                    <option value="">Select a provider</option>
                                    {availableProviders.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                <input
                                    type="text"
                                    value={newModelName}
                                    onChange={e => setNewModelName(e.target.value)}
                                    placeholder="e.g., gpt-4o, gemini-1.5-pro"
                                    className="w-full border rounded-md p-2"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                            <button
                                onClick={handleAdd}
                                disabled={!selectedProvider || !newModelName}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Model
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
