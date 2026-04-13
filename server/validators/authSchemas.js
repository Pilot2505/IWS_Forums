import { z } from "zod";

// Zod schemas for validating authentication-related request data

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(100),
    username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric or underscore"),
    password: z.string().min(6).max(100),
    fullname: z.string().trim().min(1).max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(100),
  }),
});