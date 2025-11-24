'use client';

import React, { useEffect, useState } from 'react';
import { ProviderManager, type AIProvider } from '@/services/ai/provider-manager';

export const ProviderStatusList: React.FC = () => {
    const [providers, setProviders] = useState<AIProvider[]>([]);

    useEffect(() => {
        // In a real app we'd fetch this from an API route since ProviderManager is server-side
        // For this demo/refactor, we'll assume we can get it via a server action or API
        // But wait, ProviderManager uses process.env which is available on server.
        // We need a server action or API route to get this data to the client.

        fetch('/api/ai/providers').then(res => res.json()).then(data => setProviders(data));
    }, []);

    const getProviderIcon = (id: string) => {
        switch (id) {
            case 'openai':
                return (
                    <img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/openai.png" alt="OpenAI" className="w-5 h-5" />
                );
            case 'gemini':
                return (
                    <img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/google-gemini.png" alt="Gemini" className="w-5 h-5" />
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                );
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">AI Providers</h2>
            <p className="text-sm text-gray-500">Configure providers through environment variables to enable their models.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map(provider => (
                    <div key={provider.id} className={`p-4 border rounded-lg flex items-center justify-between ${provider.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${provider.isActive ? 'bg-white text-black border border-gray-200' : 'bg-gray-200 text-gray-500'}`}>
                                {getProviderIcon(provider.id)}
                            </div>
                            <span className="font-medium">{provider.name}</span>
                        </div>
                        <div className="flex gap-2">
                            {provider.isActive ? (
                                <span className="text-xs bg-white border border-green-200 px-2 py-1 rounded-full text-green-700 font-medium">
                                    Configured
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400 border border-dashed border-gray-300 px-2 py-1 rounded-full">Not configured</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
