// server/src/module/ai/providers/huggingface.provider.ts
import { BaseAIProvider } from './base.provider';
import { GenerateTextRequest, GenerateTextResponse } from '../ai.interface';
import { InferenceClient } from '@huggingface/inference';

export class HuggingFaceProvider extends BaseAIProvider {
  name = 'huggingface';

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const { prompt, model, apiKey, temperature: _temperature, systemPrompt } = request;

    if (!apiKey) {
      throw new Error('API key is required for Hugging Face provider');
    }

    const client = new InferenceClient(apiKey);

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const chatCompletion = await client.chatCompletion({
        model: model,
        messages: messages as any,
        // temperature: temperature || 0.7,
        // max_tokens: 500,
      });

      const text = chatCompletion.choices[0]?.message?.content || '';

      return {
        provider: this.name,
        model,
        text,
        rawResponse: chatCompletion,
        createdAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Hugging Face API error: ${error.message}`);
    }
  }
}
