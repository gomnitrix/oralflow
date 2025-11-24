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
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729ZM4.9807 10.887c-1.1527 0-2.2334.468-3.0185 1.2535l-.2665.2665V11.129c0-1.1528.468-2.2335 1.2535-3.0186l.2665-.2665.2665.2665c.7851.785 1.8658 1.2535 3.0185 1.2535.375 0 .7427-.0515 1.0965-.1451l-2.6165 4.5318c-.1123-.2996-.1123-.6273 0-.9269v.0609Zm11.0846-5.8087-2.6165 4.5318c.3538.0936.7214.1451 1.0965.1451 1.1527 0 2.2334-.468 3.0185-1.2535l.2665-.2665.2665.2665c.7851.7851 1.2535 1.8658 1.2535 3.0185v1.2766l-.2665-.2665c-.7851-.7851-1.8658-1.2535-3.0185-1.2535ZM9.8947 17.4074c.3538.0936.7214.1451 1.0965.1451 1.1527 0 2.2334-.468 3.0185-1.2535l.2665-.2665.2665.2665c.7851.7851 1.2535 1.8658 1.2535 3.0185v1.2766l-.2665-.2665c-.7851-.7851-1.8658-1.2535-3.0185-1.2535l-2.6165-4.5318Zm-3.6348-3.028-2.6165-4.5318c.3538.0936.7214.1451 1.0965.1451 1.1527 0 2.2334-.468 3.0185-1.2535l.2665-.2665.2665.2665c.7851.7851 1.2535 1.8658 1.2535 3.0185v1.2766l-.2665-.2665c-.7851-.7851-1.8658-1.2535-3.0185-1.2535Zm11.0846 5.8087-2.6165 4.5318c.3538.0936.7214.1451 1.0965.1451 1.1527 0 2.2334-.468 3.0185-1.2535l.2665-.2665.2665.2665c.7851.7851 1.2535 1.8658 1.2535 3.0185v1.2766l-.2665-.2665c-.7851-.7851-1.8658-1.2535-3.0185-1.2535ZM12 10.9012c-1.1527 0-2.2334.468-3.0185 1.2535l-.2665.2665.2665.2665c.7851.7851 1.8658 1.2535 3.0185 1.2535 1.1527 0 2.2334-.468 3.0185-1.2535l.2665-.2665-.2665-.2665c-.7851-.7851-1.8658-1.2535-3.0185-1.2535Z" />
                    </svg>
                );
            case 'gemini':
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.05 2.53a.95.95 0 0 1 1.9 0c0 4.67 3.78 8.45 8.45 8.45a.95.95 0 0 1 0 1.9c-4.67 0-8.45 3.78-8.45 8.45a.95.95 0 0 1-1.9 0c0-4.67-3.78-8.45-8.45-8.45a.95.95 0 0 1 0-1.9c4.67 0 8.45-3.78 8.45-8.45Z" />
                    </svg>
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
