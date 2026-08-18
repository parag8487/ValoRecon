import { z } from 'zod';
export declare const ErrorCodeEnum: z.ZodEnum<["VR-AUTH-401", "VR-AUTH-403", "VR-DEVICE-409", "VR-DEVICE-410", "VR-DEVICE-OFFLINE", "VR-PROTOCOL-400", "VR-PROTOCOL-426", "VR-PROTOCOL-MISMATCH", "VR-CAPABILITY-UNAVAILABLE", "VR-REQUEST-400", "VR-REQUEST-409", "VR-REQUEST-413", "VR-RIOT-403", "VR-RIOT-404", "VR-RIOT-408", "VR-RIOT-429", "VR-RIOT-503", "VR-RIOT-OFFLINE", "VR-AI-401", "VR-AI-429", "VR-AI-503", "VR-AI-UNCONFIGURED", "VR-CLOUD-401", "VR-CLOUD-403", "VR-CLOUD-408", "VR-CLOUD-503", "VR-AGENT-503", "VR-AGENT-504", "VR-STORAGE-507", "VR-LIFECYCLE-499", "VR-LIFECYCLE-504", "VR-RATE-429", "VR-RATE-LIMITED", "VR-VALIDATION-400", "VR-SECURITY-400", "VR-SECURITY-503", "VR-INTERNAL-500", "VR-NOT-IMPLEMENTED"]>;
export type ErrorCode = z.infer<typeof ErrorCodeEnum>;
export declare const ErrorDetailsSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
    retryable: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    requestId?: string | undefined;
    retryable?: boolean | undefined;
}, {
    code: string;
    message: string;
    requestId?: string | undefined;
    retryable?: boolean | undefined;
}>;
export declare const AppErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
        retryable: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        requestId?: string | undefined;
        retryable?: boolean | undefined;
    }, {
        code: string;
        message: string;
        requestId?: string | undefined;
        retryable?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        code: string;
        message: string;
        requestId?: string | undefined;
        retryable?: boolean | undefined;
    };
}, {
    error: {
        code: string;
        message: string;
        requestId?: string | undefined;
        retryable?: boolean | undefined;
    };
}>;
export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;
export type AppError = z.infer<typeof AppErrorSchema>;
