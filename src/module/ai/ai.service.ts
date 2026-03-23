import { providerRegistry } from './registry/providerRegistry';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GenerateTextRequest, GenerateTextResponse } from './ai.interface';
import { MODEL_CATALOG, SUPPORTED_PROVIDERS } from './constants';

// Register all providers
providerRegistry.register(new HuggingFaceProvider());
providerRegistry.register(new GeminiProvider());
providerRegistry.register(new GroqProvider());
providerRegistry.register(new OpenRouterProvider());
providerRegistry.register(new AnthropicProvider());

export const aiService = {
  getProviders() {
    return SUPPORTED_PROVIDERS;
  },

  getModelsForProvider(provider: string) {
    return MODEL_CATALOG[provider.toLowerCase()] || [];
  },

  getProviderCatalog() {
    return MODEL_CATALOG;
  },

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const provider = providerRegistry.getProvider(request.provider);
    return provider.generateText(request);
  }
};
