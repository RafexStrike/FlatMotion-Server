export interface ModelOption {
  id: string;
  label: string;
}

export const MODEL_CATALOG: Record<string, ModelOption[]> = {
  huggingface: [
    { id: 'mistralai/Mistral-7B-Instruct-v0.2:featherless-ai', label: 'Mistral 7B Instruct v0.2' },
    { id: 'meta-llama/Meta-Llama-3-8B-Instruct', label: 'Meta LLaMA 3 8B Instruct' }
  ],
  gemini: [
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
  ],
  groq: [
    { id: 'llama3-8b-8192', label: 'LLaMA3 8B' },
    { id: 'llama3-70b-8192', label: 'LLaMA3 70B' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }
  ],
  openrouter: [
    { id: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { id: 'meta-llama/llama-3-8b-instruct', label: 'LLaMA 3 8B Instruct' }
  ],
  anthropic: [
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' }
  ]
};

export const SUPPORTED_PROVIDERS = Object.keys(MODEL_CATALOG);
