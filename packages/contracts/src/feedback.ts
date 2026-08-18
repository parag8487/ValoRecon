import { z } from 'zod';

export const FeedbackInputSchema = z.object({
  messageId: z.string().min(1).max(256),
  rating: z.enum(['up', 'down']),
  category: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
  matchId: z.string().max(256).optional()
});

export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;
