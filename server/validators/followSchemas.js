import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

const followPairSchema = z.object({
  followerId: idSchema,
  followingId: idSchema,
}).refine((data) => data.followerId !== data.followingId, {
  message: "Cannot follow yourself",
  path: ["followingId"],
});

export const followSchema = z.object({
  body: followPairSchema,
});

export const unfollowSchema = z.object({
  body: followPairSchema,
});

export const seenSchema = z.object({
  body: followPairSchema,
});

export const followCountSchema = z.object({
  params: z.object({
    userId: idSchema,
  }),
});

export const isFollowingSchema = z.object({
  query: followPairSchema,
});