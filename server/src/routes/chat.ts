import { Router, Request, Response } from 'express';
import { streamCoachChat, ChatMessage, windowMessages } from '../services/gemini';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  // Proper SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders?.();

  // Trim the conversation server-side so long chats stay within budget.
  // Sends a meta event so the UI can show "using last N messages".
  const { dropped } = windowMessages(messages);
  res.write(`data: ${JSON.stringify({ meta: { dropped, window: messages.length } })}\n\n`);

  try {
    const generator = streamCoachChat(messages);

    // If the client disconnects (Stop button, tab close), stop consuming the
    // upstream Gemini stream so we don't keep paying for generation.
    let clientGone = false;
    const onClose = () => {
      clientGone = true;
      generator.return?.(undefined);
    };
    res.on('close', onClose);

    for await (const chunk of generator) {
      if (clientGone || res.writableEnded) break;
      if (chunk) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }

    if (!clientGone && !res.writableEnded) {
      res.write('data: [DONE]\n\n');
    }
    res.end();
    res.removeListener('close', onClose);
  } catch (error: any) {
    console.error('SSE chat error:', error);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

export default router;
