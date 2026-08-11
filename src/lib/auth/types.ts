export type UserRole = "customer" | "cleaner" | "admin";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthProfile {
  id: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface AuthSession {
  user: AuthUser;
  profile: AuthProfile | null;
}
