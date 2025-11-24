export type ProviderType = 'openai' | 'gemini' | 'aihubmix' | 'openrouter';

export interface AIProvider {
    id: ProviderType;
    name: string;
    isActive: boolean;
    baseUrl?: string;
    apiKey?: string;
    capabilities: ('language' | 'embedding' | 'tts' | 'stt' | 'realtime' | 'speech_to_speech')[];
    isFirstParty: boolean;
}

export class ProviderManager {
    private static instance: ProviderManager;

    private constructor() {
        // this.providers = this.detectProviders(); // Don't cache
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
                capabilities: ['language', 'embedding', 'tts', 'stt', 'realtime', 'speech_to_speech'],
                isFirstParty: true
            },
            {
                id: 'gemini',
                name: 'Gemini',
                isActive: !!process.env.GEMINI_API_KEY,
                apiKey: process.env.GEMINI_API_KEY,
                capabilities: ['language', 'embedding', 'realtime', 'speech_to_speech'],
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
        return this.detectProviders();
    }

    public getActiveProviders(): AIProvider[] {
        return this.detectProviders().filter(p => p.isActive);
    }

    public getProvider(id: ProviderType): AIProvider | undefined {
        return this.detectProviders().find(p => p.id === id);
    }
}
