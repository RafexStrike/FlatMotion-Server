import { BaseAIProvider } from '../providers/base.provider';

class ProviderRegistry {
  private providers: Map<string, BaseAIProvider> = new Map();

  register(provider: BaseAIProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  getProvider(name: string): BaseAIProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`Provider adapter for '${name}' is not registered or supported.`);
    }
    return provider;
  }

  getAllRegisteredProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerRegistry = new ProviderRegistry();
