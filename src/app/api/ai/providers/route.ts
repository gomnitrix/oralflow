import { NextResponse } from 'next/server';
import { ProviderManager } from '@/services/ai/provider-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
    const manager = ProviderManager.getInstance();
    return NextResponse.json(manager.getProviders());
}
