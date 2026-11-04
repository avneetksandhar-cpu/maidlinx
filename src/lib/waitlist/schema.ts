import { z } from "zod";
import { emailSchema } from "@/lib/validations/common";
import { LAUNCH_MARKET_IDS } from "@/config/markets";

const marketIdSchema = z
  .string()
  .trim()
  .max(64)
  .optional()
  .nullable()
  .refine(
    (v) => v == null || v === "" || (LAUNCH_MARKET_IDS as readonly string[]).includes(v) || /^[A-Z0-9_]{2,64}$/.test(v),
    "Invalid market.",
  );

export const waitlistSignupSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .max(200, "Name is too long.")
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  marketId: marketIdSchema.transform((v) => (v && v.length > 0 ? v : null)),
  source: z
    .string()
    .trim()
    .max(80)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  page: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type WaitlistSignupInput = z.infer<typeof waitlistSignupSchema>;
