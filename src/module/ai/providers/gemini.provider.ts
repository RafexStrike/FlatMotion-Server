// src/module/ai/providers/gemini.provider.ts
import { BaseAIProvider } from './base.provider';
import { GenerateTextRequest, GenerateTextResponse } from '../ai.interface';

export class GeminiProvider extends BaseAIProvider {
  name = 'gemini';

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const { prompt, model, apiKey, temperature, systemPrompt } = request;

    if (!apiKey) {
      throw new Error('API key is required for Gemini provider');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload: any = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: temperature || 0.7,
      }
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      provider: this.name,
      model,
      text,
      rawResponse: data,
      createdAt: new Date(),
    };
  }
}
