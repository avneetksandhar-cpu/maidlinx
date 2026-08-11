import { requireRole } from "@/lib/auth/session";
import type { CustomerProfile } from "@/lib/profiles/repository";

export interface CustomerSession {
  profile: CustomerProfile;
  email: string;
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await requireRole(["customer", "admin"], "/sign-in");

  return {
    profile: {
      id: session.profile?.id ?? session.user.id,
      clerkUserId: session.user.id,
      role: "customer",
      firstName: session.profile?.firstName ?? null,
      lastName: session.profile?.lastName ?? null,
      phone: session.profile?.phone ?? null,
      email: session.user.email,
      avatarUrl: session.profile?.avatarUrl ?? null,
      onboardingComplete: true,
    },
    email: session.user.email,
  };
}
