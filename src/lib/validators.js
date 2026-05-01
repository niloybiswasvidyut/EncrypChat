import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const recoverRequestSchema = z.object({
  email: z.email(),
});

export const verifyOtpSchema = z.object({
  email: z.email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8).max(128),
});

export const createConversationSchema = z.object({
  type: z.enum(["direct", "group"]),
  name: z.string().min(2).max(80).optional(),
  participantIds: z.array(z.string()).min(1),
});

export const createMessageSchema = z.object({
  conversationId: z.string().min(10),
  body: z.string().min(1).max(4000),
  attachments: z
    .array(
      z.object({
        url: z.url(),
        name: z.string().min(1),
        size: z.number().nonnegative(),
        mimeType: z.string().min(2),
      })
    )
    .optional(),
});
