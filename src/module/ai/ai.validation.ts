import { Request, Response, NextFunction } from 'express';
// import { SUPPORTED_PROVIDERS, MODEL_CATALOG } from './constants';

export const validateChatRequest = (req: Request, res: Response, next: NextFunction): any => {
  const { prompt, provider, model, apiKey } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ success: false, message: 'Prompt is required and must be a non-empty string.' });
  }

  if (!provider || typeof provider !== 'string') {
    return res.status(400).json({ success: false, message: 'Provider is required.' });
  }

  // if (!SUPPORTED_PROVIDERS.includes(provider.toLowerCase())) {
  //   return res.status(400).json({ success: false, message: `Unsupported provider: ${provider}` });
  // }

  if (!model || typeof model !== 'string') {
    return res.status(400).json({ success: false, message: 'Model is required.' });
  }

  // const providerModels = MODEL_CATALOG[provider.toLowerCase()];
  // const isModelSupported = providerModels.some((m) => m.id === model);

  // if (!isModelSupported) {
  //   return res.status(400).json({ success: false, message: `Unsupported model '${model}' for provider '${provider}'.` });
  // }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return res.status(400).json({ success: false, message: `API key is required for provider '${provider}'.` });
  }

  next();
};
