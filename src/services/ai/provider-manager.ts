export type ProviderType = 'openai' | 'gemini' | 'aihubmix' | 'openrouter';

export interface AIProvider {
    id: ProviderType;
    name: string;
    isActive: boolean;
    baseUrl?: string;
    apiKey?: string;
    capabilities: ('language' | 'embedding' | 'tts' | 'stt' | 'realtime')[];
    isFirstParty: boolean;
}

export class ProviderManager {
    private static instance: ProviderManager;
    private providers: AIProvider[];

    private constructor() {
        this.providers = this.detectProviders();
    }

    public static getInstance(): ProviderManager {
        if (!ProviderManager.instance) {
            ProviderManager.instance = new ProviderManager();
        }
        return ProviderManager.instance;
    }

    private detectProviders(): AIProvider[] {
        return [
            {
                id: 'openai',
                name: 'OpenAI',
                isActive: !!process.env.OPENAI_API_KEY,
                apiKey: process.env.OPENAI_API_KEY,
                capabilities: ['language', 'embedding', 'tts', 'stt', 'realtime'],
                isFirstParty: true
            },
            {
                id: 'gemini',
                name: 'Gemini',
                isActive: !!process.env.GEMINI_API_KEY,
                apiKey: process.env.GEMINI_API_KEY,
                capabilities: ['language', 'embedding', 'realtime'], // Gemini supports multimodal but mapping to these for now
                isFirstParty: true
            },
            {
                id: 'aihubmix',
                name: 'AiHubMix',
                isActive: !!process.env.AIHUBMIX_API_KEY,
                baseUrl: process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com/v1',
                apiKey: process.env.AIHUBMIX_API_KEY,
                capabilities: ['language', 'embedding', 'tts', 'stt'],
                isFirstParty: false
            },
            {
                id: 'openrouter',
                name: 'OpenRouter',
                isActive: !!process.env.OPENROUTER_API_KEY,
                baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
                apiKey: process.env.OPENROUTER_API_KEY,
                capabilities: ['language', 'embedding'],
                isFirstParty: false
            }
        ];
    }

    public getProviders(): AIProvider[] {
        return this.providers;
    }

    public getActiveProviders(): AIProvider[] {
        return this.providers.filter(p => p.isActive);
    }

    public getProvider(id: ProviderType): AIProvider | undefined {
        return this.providers.find(p => p.id === id);
    }
}
