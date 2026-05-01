import { z } from "zod";

// Zod schemas for validating post-related request data

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

export const postsListSchema = z.object({
  query: z.object({
    cursor: z.string().trim().min(1).optional().nullable().default(null),
    limit: z.coerce.number().int().min(1).max(50).optional().default(5),
    sortBy: z.enum(["date", "upvotes"]).optional().default("date"),
    sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().trim().max(200).optional().default(""),
  }),
});

export const recommendedSchema = z.object({
  query: z.object({
    cursor: z.string().trim().min(1).optional().nullable().default(null),
    limit: z.coerce.number().int().min(1).max(50).optional().default(5),
    sortBy: z.enum(["date", "upvotes"]).optional().default("date"),
    sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
    categories: z.string().trim().min(1),
  }),
});

export const userPostsListSchema = z.object({
  params: z.object({
    username: z.string().trim().min(1).max(50),
  }),
  query: z.object({
    cursor: z.string().trim().min(1).optional().nullable().default(null),
    limit: z.coerce.number().int().min(1).max(50).optional().default(5),
    sortBy: z.enum(["date", "upvotes"]).optional().default("date"),
    sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const postIdParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1),
    userId: z.coerce.number().int().positive(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(5000),
    user_id: z.coerce.number().int().positive(),
    parent_id: z.coerce.number().int().positive().nullable().optional(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const deleteCommentSchema = z.object({
  body: z.object({
    userId: z.coerce.number().int().positive(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const votePostSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    vote: z.coerce.number().int().refine((value) => [-1, 0, 1].includes(value), {
      message: "Vote must be -1, 0, or 1",
    }),
  }),
});
