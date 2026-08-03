import { z } from "zod";

export const postDraftSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().max(120),
  excerpt: z.string().trim().max(240),
  contentJson: z.array(z.record(z.string(), z.unknown())).min(1),
  coverImageUrl: z.url().nullable().optional(),
  coverImageAlt: z.string().trim().max(160).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(5),
  version: z.number().int().positive(),
});

export const publishPostSchema = postDraftSchema.extend({
  title: z.string().trim().min(5).max(120),
  excerpt: z.string().trim().min(20).max(240),
  contentText: z.string().trim().min(80),
}).superRefine((value, context) => {
  if (value.coverImageUrl && !value.coverImageAlt) {
    context.addIssue({
      code: "custom",
      path: ["coverImageAlt"],
      message: "Add descriptive alt text for the cover image.",
    });
  }
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(28)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letters, numbers, and single hyphens."),
  bio: z.string().trim().max(280),
});

export const searchSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  tag: z.string().trim().max(48).catch(""),
  page: z.coerce.number().int().positive().catch(1),
});

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
