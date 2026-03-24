// server/src/module/ai/ai.interface.ts
export interface GenerateTextRequest {
  prompt: string;
  provider: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface GenerateTextResponse {
  provider: string;
  model: string;
  text: string;
  rawResponse?: any;
  usage?: any;
  createdAt: Date;
}
