import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const FEEDBACK_FILE = path.join(__dirname, '..', '..', 'data', 'feedback.jsonl');

/**
 * Capture 👍/👎 feedback on coach responses. Appended to a local JSONL file
 * (server/data/ is gitignored) — this becomes the dataset for improving the
 * coach over time.
 */
router.post('/feedback', (req: Request, res: Response) => {
  const { messageId, rating, category, comment, matchId } = req.body || {};
  if (!messageId || !['up', 'down'].includes(rating)) {
    res.status(400).json({ error: 'messageId and rating ("up"|"down") are required' });
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
    if (!fs.existsSync(path.dirname(FEEDBACK_FILE))) {
      fs.mkdirSync(path.dirname(FEEDBACK_FILE), { recursive: true });
    }
    fs.appendFileSync(FEEDBACK_FILE, JSON.stringify(entry) + '\n', 'utf8');
    res.json({ ok: true });
  } catch (e: any) {
    console.error('Failed to save feedback:', e);
    res.status(500).json({ error: e.message || 'Failed to save feedback' });
  }
});

export default router;
