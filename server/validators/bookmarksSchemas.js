import { z } from "zod";

export const bookmarkPostParamsSchema = z.object({
  params: z.object({
    postId: z.coerce.number().int().positive(),
  }),
});

export const bookmarksListSchema = z.object({
  query: z.object({
    cursor: z.string().trim().min(1).optional().nullable().default(null),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});
