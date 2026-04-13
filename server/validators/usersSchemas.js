import { z } from "zod";

// Zod schemas for validating user-related request data

const categoryIds = [
  "javascript",
  "python",
  "java",
  "cpp",
  "web",
  "mobile",
  "database",
  "devops",
  "ai_ml",
  "security",
  "cloud",
  "opensource",
];

export const updateProfileSchema = z.object({
  body: z.object({
    id: z.coerce.number().int().positive(),
    fullname: z.string().trim().min(1).max(100),
    email: z.string().email().trim(),
    username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    bio: z.string().trim().max(150).optional().default(""),
    avatar: z.string().trim().nullable().optional(),
  }),
});

export const categoriesSchema = z.object({
  body: z.object({
    userId: z.coerce.number().int().positive(),
    categories: z.array(z.enum(categoryIds)).max(3),
  }),
});

export const uploadAvatarSchema = z.object({
  body: z.object({
    userId: z.coerce.number().int().positive(),
  }),
});

export const usernameParamsSchema = z.object({
  params: z.object({
    username: z.string().trim().min(1).max(50),
  }),
});