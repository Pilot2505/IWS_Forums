import { z } from "zod";

export const bookmarkPostParamsSchema = z.object({
  params: z.object({
    postId: z.coerce.number().int().positive(),
  }),
});
