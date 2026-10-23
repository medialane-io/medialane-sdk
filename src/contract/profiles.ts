import { z } from "zod";

export const urlField = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .string()
    .url()
    .refine((v) => v.startsWith("https://") || v.startsWith("http://"), {
      message: "URL must use http or https scheme",
    })
    .nullable()
    .optional(),
);

export const collectionProfileSchema = z.object({
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  bannerImage: z.string().nullable().optional(),
  websiteUrl: urlField,
  twitterUrl: urlField,
  discordUrl: urlField,
  telegramUrl: urlField,
  gatedContentTitle: z.string().max(100).nullable().optional(),
  gatedContentUrl: urlField,
  gatedContentType: z.enum(["VIDEO", "STREAM", "AUDIO", "DOCUMENT", "LINK"]).nullable().optional(),
});

export const creatorProfileSchema = z.object({
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatarImage: z.string().nullable().optional(),
  websiteUrl: urlField,
  twitterUrl: urlField,
  discordUrl: urlField,
  telegramUrl: urlField,
});
