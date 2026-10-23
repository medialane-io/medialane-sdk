import { z } from "zod";

export const submitReportSchema = z.object({
  targetType: z.enum(["COLLECTION", "TOKEN", "CREATOR", "COMMENT"]),
  targetKey: z.string().min(1),
  targetContract: z.string().optional(),
  targetTokenId: z.string().optional(),
  targetAddress: z.string().optional(),
  targetId: z.string().optional(),
  categories: z
    .array(
      z.enum([
        "COPYRIGHT_PIRACY",
        "VIOLENCE_GRAPHIC",
        "HATE_SPEECH",
        "SCAM_FRAUD",
        "SPAM",
        "NSFW",
        "OTHER",
      ])
    )
    .min(1, "At least one category is required"),
  description: z.string().max(500).optional(),
});
