import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'ai-settings.json');

export interface AIModel {
    id: string;
    name: string;
    provider: string;
    capabilities: ('language' | 'embedding' | 'tts' | 'stt')[];
}

export interface AISettings {
    models: {
        language: AIModel[];
        embedding: AIModel[];
        tts: AIModel[];
        stt: AIModel[];
    };
    assignments: {
        chat: string | null; // model ID
        tools: string | null;
        embedding: string | null;
        tts: string | null;
        stt: string | null;
        realtime: string | null;
    };
}

const DEFAULT_SETTINGS: AISettings = {
    models: {
        language: [],
        embedding: [],
        tts: [],
        stt: []
    },
    assignments: {
        chat: null,
        tools: null,
        embedding: null,
        tts: null,
        stt: null,
        realtime: null
    }
};

export class SettingsService {
    private static instance: SettingsService;
    private settings: AISettings;

    private constructor() {
        this.settings = this.loadSettings();
    }

    public static getInstance(): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();
        }
        return SettingsService.instance;
    }

    private loadSettings(): AISettings {
        try {
            if (fs.existsSync(SETTINGS_FILE)) {
                const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
                return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('Failed to load AI settings:', error);
        }
        return DEFAULT_SETTINGS;
    }

    private saveSettings(): void {
        try {
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            console.error('Failed to save AI settings:', error);
        }
    }

    public getSettings(): AISettings {
        return this.settings;
    }

    public updateAssignments(assignments: Partial<AISettings['assignments']>): void {
        this.settings.assignments = { ...this.settings.assignments, ...assignments };
        this.saveSettings();
    }

    public addModel(category: keyof AISettings['models'], model: AIModel): void {
        // Avoid duplicates
        if (!this.settings.models[category].find(m => m.id === model.id)) {
            this.settings.models[category].push(model);
            this.saveSettings();
        }
    }

    public removeModel(category: keyof AISettings['models'], modelId: string): void {
        this.settings.models[category] = this.settings.models[category].filter(m => m.id !== modelId);
        this.saveSettings();
    }
}
