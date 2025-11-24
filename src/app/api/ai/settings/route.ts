import { NextResponse } from 'next/server';
import { SettingsService } from '@/services/ai/settings';

export async function GET() {
    const settings = SettingsService.getInstance().getSettings();
    return NextResponse.json(settings);
}

export async function POST(request: Request) {
    const body = await request.json();
    const settingsService = SettingsService.getInstance();

    if (body.type === 'assignment') {
        settingsService.updateAssignments(body.data);
    } else if (body.type === 'addModel') {
        settingsService.addModel(body.category, body.model);
    } else if (body.type === 'removeModel') {
        settingsService.removeModel(body.category, body.modelId);
    }

    return NextResponse.json(settingsService.getSettings());
}
