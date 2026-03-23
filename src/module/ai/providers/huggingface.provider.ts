import { BaseAIProvider } from './base.provider';
import { GenerateTextRequest, GenerateTextResponse } from '../ai.interface';

export class HuggingFaceProvider extends BaseAIProvider {
  name = 'huggingface';

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const { prompt, model, apiKey, temperature, systemPrompt } = request;

    if (!apiKey) {
      throw new Error('API key is required for Hugging Face provider');
    }

    // Using the chat completions API compatibility if possible, or standard endpoint
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const payload = {
      inputs: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      parameters: {
        return_full_text: false,
        temperature: temperature || 0.7,
        max_new_tokens: 500,
      },
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
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let text = '';

    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else {
      text = JSON.stringify(data); // Fallback
    }

    return {
      provider: this.name,
      model,
      text,
      rawResponse: data,
      createdAt: new Date(),
    };
  }
}
