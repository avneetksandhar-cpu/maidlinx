export type AuthMethod = "apple" | "google" | "email";

export type AuthState = {
  isLoading: boolean;
  error: string | null;
};

export type AuthHandler = (method: AuthMethod) => Promise<void>;

export type EmailAuthPayload = {
  email: string;
  password?: string;
  mode: "signin" | "signup" | "magic-link";
};

export type AuthProviderConfig = {
  provider: "supabase" | "clerk";
  enabledMethods: AuthMethod[];
};
