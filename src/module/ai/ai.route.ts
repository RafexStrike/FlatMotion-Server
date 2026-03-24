// server/src/module/ai/ai.route.ts
import { Router } from 'express';
import { getProviders, getModels, generateChat } from './ai.controller';
import { validateChatRequest } from './ai.validation';

const router = Router();

router.get('/providers', getProviders);
router.get('/models', getModels);
router.post('/chat', validateChatRequest, generateChat);

export default router;
