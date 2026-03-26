// server/src/module/ai/providers/anthropic.provider.ts
import { BaseAIProvider } from './base.provider';
import { GenerateTextRequest, GenerateTextResponse } from '../ai.interface';

export class AnthropicProvider extends BaseAIProvider {
  name = 'anthropic';

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const { prompt, model, apiKey, temperature, systemPrompt } = request;

    if (!apiKey) {
      throw new Error('API key is required for Anthropic provider');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    
    const payload: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: temperature || 0.7,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    const text = data.content?.[0]?.text || '';

    return {
      provider: this.name,
      model,
      text,
      rawResponse: data,
      usage: data.usage,
      createdAt: new Date(),
    };
  }
}
