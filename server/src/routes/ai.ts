import { Router, Request, Response } from 'express';
import { getAiSettings, setAiSettings, listAvailableModels, listVerifiedModels, testModel, getUsageStats } from '../services/gemini';

const router = Router();

// Current AI engine settings (masked key, model, whether env key is in use).
router.get('/ai/settings', (_req: Request, res: Response) => {
  res.json(getAiSettings());
});

// Update API key and/or model.
router.post('/ai/settings', (req: Request, res: Response) => {
  const { apiKey, model } = req.body || {};
  res.json(setAiSettings({ apiKey, model }));
});

// List models available to the configured (or a provided) key.
// Pass { verify: true } to live-test each and return only genuinely working ones.
router.post('/ai/models', async (req: Request, res: Response) => {
  const { apiKey, verify } = req.body || {};
  const result = verify
    ? await listVerifiedModels(apiKey)
    : await listAvailableModels(apiKey);
  res.json(result);
});

// Test a model + key actually respond.
router.post('/ai/test', async (req: Request, res: Response) => {
  const { model, apiKey } = req.body || {};
  const result = await testModel(model, apiKey);
  res.json(result);
});

// Token usage / estimated cost dashboard.
router.get('/ai/usage', (_req: Request, res: Response) => {
  res.json(getUsageStats());
});

export default router;
