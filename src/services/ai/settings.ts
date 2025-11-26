import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = process.env.LOCAL_STORAGE_PATH
    ? path.join(process.env.LOCAL_STORAGE_PATH, 'ai-settings.json')
    : path.join(process.cwd(), 'ai-settings.json');

export interface AIModel {
    id: string;
    name: string;
    provider: string;
    capabilities: ('language' | 'tts' | 'stt' | 'realtime_speech')[];
}

export interface AISettings {
    models: {
        language: AIModel[];
        tts: AIModel[];
        stt: AIModel[];
        realtime_speech: AIModel[];
    };
    assignments: {
        // Zen Mode
        zen_realtime: string | null;

        // STW Mode
        stw_chat: string | null;
        stw_stt: string | null;
        stw_tts: string | null;
        stw_assessment_text: string | null;
        stw_goal: string | null;

        // Copilot
        copilot_distill: string | null;
        copilot_inspiration: string | null;

        // Other Scenarios
        scenario_draft: string | null;
        ask_ai: string | null;
        review_notes: string | null;

        // Zen Mode
        zen_goal: string | null;
    };
}

export type AssignmentCapability = keyof AISettings['assignments'];

const DEFAULT_SETTINGS: AISettings = {
    models: {
        language: [],
        tts: [],
        stt: [],
        realtime_speech: []
    },
    assignments: {
        zen_realtime: null,
        stw_chat: null,
        stw_stt: null,
        stw_tts: null,
        stw_assessment_text: null,
        stw_goal: null,
        copilot_distill: null,
        copilot_inspiration: null,
        scenario_draft: null,
        ask_ai: null,
        review_notes: null,
        zen_goal: null,
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
                const parsed = JSON.parse(data) as Partial<AISettings>;

                const parsedModels = (parsed.models ?? {}) as Partial<AISettings['models']>;
                const parsedAssignments = (parsed.assignments ?? {}) as Partial<AISettings['assignments']>;

                return {
                    ...DEFAULT_SETTINGS,
                    ...parsed,
                    models: {
                        ...DEFAULT_SETTINGS.models,
                        language: parsedModels.language ?? [],
                        tts: parsedModels.tts ?? [],
                        stt: parsedModels.stt ?? [],
                        realtime_speech: parsedModels.realtime_speech ?? [],
                    },
                    assignments: {
                        ...DEFAULT_SETTINGS.assignments,
                        ...parsedAssignments,
                    }
                };
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
