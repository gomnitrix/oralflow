import fs from 'fs';
import path from 'path';
import { resolveStorageRoot } from "../persistence/storage-root";

const SETTINGS_FILE = path.join(resolveStorageRoot(), 'ai-settings.json');
const LEGACY_SETTINGS_FILE = path.join(process.cwd(), 'ai-settings.json');

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
        stw_audio: string | null;
        stw_assessment_text: string | null;
        stw_goal: string | null;

        // Copilot
        copilot_distill: string | null;
        copilot_inspiration: string | null;

        // Other Scenarios
        scenario_draft: string | null;
        ask_ai: string | null;
        review_notes: string | null;
        free_chat_draft: string | null;
        notebook_tts: string | null;

        // Zen Mode
        zen_goal: string | null;

        // Training
        training_generator: string | null;
        training_evaluator: string | null;
    };
    config: {
        copilot: {
            distillLevel: string;
            inspirationLevel: string;
        };
        stw: {
            goalEvaluationStartTurn: number;
            responseMode: "sequential" | "native_audio";
        };
        pronunciation: {
            granularity: "phoneme" | "word" | "fulltext";
        };
        training: {
            readAloudPassScore: number;
            newCardProbability: {
                forgot: number;
                hard: number;
                good: number;
                easy: number;
            };
        };
    };
}

export type AssignmentCapability = keyof AISettings['assignments'];
export type AIConfigUpdate = {
    copilot?: Partial<AISettings['config']['copilot']>;
    stw?: Partial<AISettings['config']['stw']>;
    pronunciation?: Partial<AISettings['config']['pronunciation']>;
    training?: Partial<AISettings['config']['training']>;
};

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
        stw_audio: null,
        stw_assessment_text: null,
        stw_goal: null,
        copilot_distill: null,
        copilot_inspiration: null,
        scenario_draft: null,
        ask_ai: null,
        review_notes: null,
        free_chat_draft: null,
        notebook_tts: null,
        zen_goal: null,
        training_generator: null,
        training_evaluator: null,
    },
    config: {
        copilot: {
            distillLevel: "B1+",
            inspirationLevel: "B1+",
        },
        stw: {
            goalEvaluationStartTurn: 5,
            responseMode: "sequential",
        },
        pronunciation: {
            granularity: "phoneme",
        },
        training: {
            readAloudPassScore: 80,
            newCardProbability: {
                forgot: 0.5,
                hard: 0.3,
                good: 0.3,
                easy: 0.2,
            },
        },
    },
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
            const settingsPath = fs.existsSync(SETTINGS_FILE)
                ? SETTINGS_FILE
                : fs.existsSync(LEGACY_SETTINGS_FILE)
                    ? LEGACY_SETTINGS_FILE
                    : null;

            if (settingsPath) {
                const data = fs.readFileSync(settingsPath, 'utf-8');
                const parsed = JSON.parse(data) as Partial<AISettings>;

                const parsedModels = (parsed.models ?? {}) as Partial<AISettings['models']>;
                const parsedAssignments = (parsed.assignments ?? {}) as Partial<AISettings['assignments']>;
                const parsedConfig = (parsed as Partial<AISettings>).config ?? {};

                const mergedConfig = {
                    copilot: {
                        ...DEFAULT_SETTINGS.config.copilot,
                        ...(parsedConfig as any)?.copilot,
                    },
                    stw: {
                        ...DEFAULT_SETTINGS.config.stw,
                        ...(parsedConfig as any)?.stw,
                    },
                    pronunciation: {
                        ...DEFAULT_SETTINGS.config.pronunciation,
                        ...(parsedConfig as any)?.pronunciation,
                    },
                    training: {
                        ...DEFAULT_SETTINGS.config.training,
                        ...(parsedConfig as any)?.training,
                    },
                };

                const normalizedStartTurn = (() => {
                    const value = (mergedConfig as any)?.stw?.goalEvaluationStartTurn;
                    const num = typeof value === 'number' ? value : Number(value);
                    if (!Number.isFinite(num)) return DEFAULT_SETTINGS.config.stw.goalEvaluationStartTurn;
                    return Math.min(10, Math.max(1, Math.round(num)));
                })();

                const normalizedGranularity = (() => {
                    const value = (mergedConfig as any)?.pronunciation?.granularity?.toLowerCase?.();
                    if (value === "word" || value === "fulltext") return value;
                    return DEFAULT_SETTINGS.config.pronunciation.granularity;
                })();

                const normalizedResponseMode = (() => {
                    const value = (mergedConfig as any)?.stw?.responseMode;
                    if (value === "native_audio") return value;
                    return DEFAULT_SETTINGS.config.stw.responseMode;
                })();

                const clampPassScore = (() => {
                    const value = (mergedConfig as any)?.training?.readAloudPassScore;
                    const num = typeof value === 'number' ? value : Number(value);
                    if (!Number.isFinite(num)) return DEFAULT_SETTINGS.config.training.readAloudPassScore;
                    return Math.min(100, Math.max(0, Math.round(num)));
                })();

                const normalizeProbability = (value: unknown, fallback: number) => {
                    const num = typeof value === "number" ? value : Number(value);
                    if (!Number.isFinite(num)) return fallback;
                    return Math.min(1, Math.max(0, num));
                };

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
                    },
                    config: {
                        copilot: mergedConfig.copilot,
                        stw: {
                            ...mergedConfig.stw,
                            goalEvaluationStartTurn: normalizedStartTurn,
                            responseMode: normalizedResponseMode,
                        },
                        pronunciation: {
                            ...mergedConfig.pronunciation,
                            granularity: normalizedGranularity as AISettings['config']['pronunciation']['granularity'],
                        },
                        training: {
                            ...mergedConfig.training,
                            readAloudPassScore: clampPassScore,
                            newCardProbability: {
                                forgot: normalizeProbability((mergedConfig as any)?.training?.newCardProbability?.forgot, DEFAULT_SETTINGS.config.training.newCardProbability.forgot),
                                hard: normalizeProbability((mergedConfig as any)?.training?.newCardProbability?.hard, DEFAULT_SETTINGS.config.training.newCardProbability.hard),
                                good: normalizeProbability((mergedConfig as any)?.training?.newCardProbability?.good, DEFAULT_SETTINGS.config.training.newCardProbability.good),
                                easy: normalizeProbability((mergedConfig as any)?.training?.newCardProbability?.easy, DEFAULT_SETTINGS.config.training.newCardProbability.easy),
                            },
                        },
                    },
                };
            }
        } catch (error) {
            console.error('Failed to load AI settings:', error);
        }
        return DEFAULT_SETTINGS;
    }

    private saveSettings(): void {
        try {
            fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
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

    public updateConfig(config: AIConfigUpdate): void {
        const clampTurn = (value?: number) => {
            if (typeof value !== 'number' || Number.isNaN(value)) return this.settings.config.stw.goalEvaluationStartTurn;
            return Math.min(10, Math.max(1, Math.round(value)));
        };

        const normalizeGranularity = (value?: string): AISettings['config']['pronunciation']['granularity'] => {
            if (!value) return this.settings.config.pronunciation.granularity;
            const normalized = value.toLowerCase() as AISettings['config']['pronunciation']['granularity'];
            if (normalized === "word" || normalized === "fulltext") return normalized;
            return "phoneme";
        };

        const normalizeResponseMode = (value?: string): AISettings['config']['stw']['responseMode'] => {
            if (value === "native_audio") return "native_audio";
            return "sequential";
        };

        const normalizeProbability = (value: unknown, fallback: number) => {
            const num = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(num)) return fallback;
            return Math.min(1, Math.max(0, num));
        };

        const clampPassScore = (value?: number) => {
            if (typeof value !== 'number' || Number.isNaN(value)) return this.settings.config.training.readAloudPassScore;
            return Math.min(100, Math.max(0, Math.round(value)));
        };

        this.settings.config = {
            copilot: {
                ...this.settings.config.copilot,
                ...(config.copilot ?? {}),
            },
            stw: {
                ...this.settings.config.stw,
                ...(config.stw ?? {}),
                goalEvaluationStartTurn: config.stw?.goalEvaluationStartTurn !== undefined
                    ? clampTurn(config.stw.goalEvaluationStartTurn)
                    : this.settings.config.stw.goalEvaluationStartTurn,
                responseMode: config.stw?.responseMode !== undefined
                    ? normalizeResponseMode(config.stw.responseMode)
                    : this.settings.config.stw.responseMode,
            },
            pronunciation: {
                ...this.settings.config.pronunciation,
                ...(config.pronunciation ?? {}),
                granularity: normalizeGranularity(config.pronunciation?.granularity),
            },
            training: {
                ...this.settings.config.training,
                ...(config.training ?? {}),
                readAloudPassScore: config.training?.readAloudPassScore !== undefined
                    ? clampPassScore(config.training.readAloudPassScore)
                    : this.settings.config.training.readAloudPassScore,
                newCardProbability: {
                    ...this.settings.config.training.newCardProbability,
                    ...(config.training?.newCardProbability ?? {}),
                },
            },
        };
        const normalizedTraining = this.settings.config.training;
        this.settings.config.training = {
            ...normalizedTraining,
            readAloudPassScore: clampPassScore(normalizedTraining.readAloudPassScore),
            newCardProbability: {
                forgot: normalizeProbability(normalizedTraining.newCardProbability.forgot, DEFAULT_SETTINGS.config.training.newCardProbability.forgot),
                hard: normalizeProbability(normalizedTraining.newCardProbability.hard, DEFAULT_SETTINGS.config.training.newCardProbability.hard),
                good: normalizeProbability(normalizedTraining.newCardProbability.good, DEFAULT_SETTINGS.config.training.newCardProbability.good),
                easy: normalizeProbability(normalizedTraining.newCardProbability.easy, DEFAULT_SETTINGS.config.training.newCardProbability.easy),
            },
        };
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
