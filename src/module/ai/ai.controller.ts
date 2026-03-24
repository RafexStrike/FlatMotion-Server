// server/src/module/ai/ai.controller.ts
import { Request, Response } from 'express';
import { aiService } from './ai.service';
import { GenerateTextRequest } from './ai.interface';

export const getProviders = (_req: Request, res: Response): any => {
  try {
    const catalog = aiService.getProviderCatalog();
    return res.status(200).json({ success: true, data: catalog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getModels = (req: Request, res: Response): any => {
  try {
    const provider = req.query.provider as string;
    
    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider query parameter is required' });
    }

    const models = aiService.getModelsForProvider(provider);
    return res.status(200).json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateChat = async (req: Request, res: Response) => {
  try {
    const requestPayload: GenerateTextRequest = {
      prompt: req.body.prompt,
      provider: req.body.provider,
      model: req.body.model,
      apiKey: req.body.apiKey,
      temperature: req.body.temperature,
      systemPrompt: req.body.systemPrompt,
    };

    const response = await aiService.generateText(requestPayload);
    res.status(200).json({ success: true, data: response });
  } catch (error: any) {
    // Redact API key from logs if printing or returning, but here we just return the error message
    console.error('[AI Provider Error]:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate text' });
  }
};
