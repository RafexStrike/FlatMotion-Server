// server/src/module/ai/constants.ts

export interface ModelOption {
  id: string;
  label: string;
}

export const MODEL_CATALOG: Record<string, ModelOption[]> = {
  huggingface: [
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.2:featherless-ai',
      label: 'Mistral 7B Instruct v0.2',
    },
    {
      id: 'meta-llama/Meta-Llama-3-8B-Instruct',
      label: 'Meta LLaMA 3 8B Instruct',
    },
  ],

  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-001', label: 'Gemini 2.0 Flash 001' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
    { id: 'gemini-2.0-flash-lite-001', label: 'Gemini 2.0 Flash-Lite 001' },
    { id: 'gemini-flash-latest', label: 'Gemini Flash Latest' },
    { id: 'gemini-flash-lite-latest', label: 'Gemini Flash-Lite Latest' },
    { id: 'gemini-pro-latest', label: 'Gemini Pro Latest' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    {
      id: 'gemini-2.5-flash-lite-preview-09-2025',
      label: 'Gemini 2.5 Flash-Lite Preview Sep 2025',
    },
    { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview' },
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
    {
      id: 'gemini-3.1-pro-preview-customtools',
      label: 'Gemini 3.1 Pro Preview Custom Tools',
    },
    {
      id: 'gemini-3.1-flash-lite-preview',
      label: 'Gemini 3.1 Flash Lite Preview',
    },

    // Optional Gemma models exposed through the same API
    { id: 'gemma-3-1b-it', label: 'Gemma 3 1B' },
    { id: 'gemma-3-4b-it', label: 'Gemma 3 4B' },
    { id: 'gemma-3-12b-it', label: 'Gemma 3 12B' },
    { id: 'gemma-3-27b-it', label: 'Gemma 3 27B' },
    { id: 'gemma-3n-e4b-it', label: 'Gemma 3n E4B' },
    { id: 'gemma-3n-e2b-it', label: 'Gemma 3n E2B' },
  ],

  groq: [
    { id: 'llama3-8b-8192', label: 'LLaMA 3 8B' },
    { id: 'llama3-70b-8192', label: 'LLaMA 3 70B' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],

  openrouter: [
    { id: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { id: 'meta-llama/llama-3-8b-instruct', label: 'LLaMA 3 8B Instruct' },
  ],

  anthropic: [
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  ],
};

export const SUPPORTED_PROVIDERS = Object.keys(MODEL_CATALOG);