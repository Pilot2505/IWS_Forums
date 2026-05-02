import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const notificationsListSchema = z.object({
  query: z.object({
    cursor: z.string().trim().min(1).optional().nullable().default(null),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    unreadOnly: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((value) => String(value ?? "false") === "true"),
  }),
});
