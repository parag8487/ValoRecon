import { Router, Request, Response } from 'express';
import { defaultStateStore } from '../storage/stateStore';
import { createLogger } from '../logger';

const router = Router();
const logger = createLogger('feedback');

/**
 * Capture 👍/👎 feedback on coach responses. Appended to local JSONL storage.
 */
router.post('/feedback', (req: Request, res: Response) => {
  const { messageId, rating, category, comment, matchId } = req.body || {};
  if (!messageId || !['up', 'down'].includes(rating)) {
    res.status(400).json({
      error: {
        code: 'VR-VALIDATION-400',
        message: 'messageId and rating ("up"|"down") are required',
        requestId: req.id,
        retryable: false
      }
    });
    return;
  }

  const entry = {
    ts: new Date().toISOString(),
    messageId: String(messageId).slice(0, 200),
    rating,
    category: typeof category === 'string' ? category.slice(0, 100) : null,
    comment: typeof comment === 'string' ? comment.slice(0, 2000) : null,
    matchId: typeof matchId === 'string' ? matchId.slice(0, 200) : null,
  };

  try {
    defaultStateStore.appendJsonLine('feedback.jsonl', entry);
    res.json({ ok: true });
  } catch (e: any) {
    logger.error('Failed to save feedback', e.message);
    res.status(500).json({
      error: {
        code: 'VR-STORAGE-507',
        message: e.message || 'Failed to save feedback',
        requestId: req.id,
        retryable: false
      }
    });
  }
});

export default router;

