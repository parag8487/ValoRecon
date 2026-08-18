import { z } from 'zod';
export declare const FeedbackInputSchema: z.ZodObject<{
    messageId: z.ZodString;
    rating: z.ZodEnum<["up", "down"]>;
    category: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
    matchId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: "up" | "down";
    messageId: string;
    matchId?: string | undefined;
    category?: string | undefined;
    comment?: string | undefined;
}, {
    rating: "up" | "down";
    messageId: string;
    matchId?: string | undefined;
    category?: string | undefined;
    comment?: string | undefined;
}>;
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;
