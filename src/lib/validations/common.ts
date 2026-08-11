import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number.");

export const addressSchema = z.object({
  line1: z.string().trim().min(1, "Street address is required."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State or province is required."),
  postalCode: z.string().trim().min(3, "Postal code is required."),
  country: z.string().trim().length(2, "Use a two-letter country code."),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: phoneSchema.optional(),
});

export const onboardingRoleSchema = z.object({
  role: z.enum(["customer", "professional"]),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type OnboardingRoleInput = z.infer<typeof onboardingRoleSchema>;
