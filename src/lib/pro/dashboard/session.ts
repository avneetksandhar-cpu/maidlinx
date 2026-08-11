import { requireRole } from "@/lib/auth/session";
import { ensureProfessionalProfile } from "@/lib/professionals/repository";
import type { ProfessionalProfile } from "@/lib/professionals/repository";

export interface ProfessionalSession {
  profile: ProfessionalProfile;
  email: string;
}

export async function requireProfessionalSession(): Promise<ProfessionalSession> {
  const session = await requireRole(["cleaner", "admin"], "/sign-in");

  const profile = await ensureProfessionalProfile({
    authUserId: session.user.id,
    email: session.user.email,
    firstName: session.profile?.firstName,
    lastName: session.profile?.lastName,
    phone: session.profile?.phone,
    avatarUrl: session.profile?.avatarUrl,
  });

  return { profile, email: session.user.email };
}
