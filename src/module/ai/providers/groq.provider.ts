// server/src/module/ai/providers/groq.provider.ts
import { BaseAIProvider } from './base.provider';
import { GenerateTextRequest, GenerateTextResponse } from '../ai.interface';

export class GroqProvider extends BaseAIProvider {
  name = 'groq';

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const { prompt, model, apiKey, temperature, systemPrompt } = request;

    if (!apiKey) {
      throw new Error('API key is required for Groq provider');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model,
      messages,
      temperature: temperature || 0.7,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    const text = data.choices?.[0]?.message?.content || '';

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
