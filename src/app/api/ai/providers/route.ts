import { NextResponse } from 'next/server';
import { ProviderManager } from '@/services/ai/provider-manager';

export async function GET() {
    const manager = ProviderManager.getInstance();
    return NextResponse.json(manager.getProviders());
}
