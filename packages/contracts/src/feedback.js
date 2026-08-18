"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackInputSchema = void 0;
const zod_1 = require("zod");
exports.FeedbackInputSchema = zod_1.z.object({
    messageId: zod_1.z.string().min(1).max(256),
    rating: zod_1.z.enum(['up', 'down']),
    category: zod_1.z.string().max(100).optional(),
    comment: zod_1.z.string().max(2000).optional(),
    matchId: zod_1.z.string().max(256).optional()
});
