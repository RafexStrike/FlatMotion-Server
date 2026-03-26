// server/src/module/ai/providers/base.provider.ts
import { GenerateTextRequest, GenerateTextResponse } from '../ai.interface';

export abstract class BaseAIProvider {
  /**
   * The name of the provider (e.g., 'huggingface')
   */
  abstract readonly name: string;

  /**
   * Generates text based on the normalized request.
   * Implementation must convert the prompt to the provider's specific format,
   * make the API call, and convert the result back to GenerateTextResponse.
   */
  abstract generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
}
