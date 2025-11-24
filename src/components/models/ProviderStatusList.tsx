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

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">AI Providers</h2>
            <p className="text-sm text-gray-500">Configure providers through environment variables to enable their models.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map(provider => (
                    <div key={provider.id} className={`p-4 border rounded-lg flex items-center justify-between ${provider.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${provider.isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                                {provider.isActive ? '✓' : '×'}
                            </div>
                            <span className="font-medium">{provider.name}</span>
                        </div>
                        <div className="flex gap-2">
                            {provider.isActive ? (
                                <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                                    {provider.capabilities.map(cap => (
                                        <span key={cap} className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                            {cap}
                                        </span>
                                    ))}
                                </div>
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
