/** Placeholder until Supabase codegen is wired up. */
export type Database = Record<string, never>;

export type MembershipTier = "guest" | "member" | "vip" | "black";

export type User = {
  id: string;
  email: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  membershipTier: MembershipTier;
  createdAt: string;
};

export type Host = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
};

export type ExperienceCategory =
  | "nightlife"
  | "dining"
  | "yachts"
  | "events"
  | "travel"
  | "concierge";

export type Experience = {
  id: string;
  title: string;
  description: string;
  category: ExperienceCategory;
  location: string;
  city: string;
  imageUrl: string;
  galleryUrls?: string[];
  priceFrom: number;
  currency: string;
  hostId: string;
  host?: Host;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  availableDates?: string[];
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type Booking = {
  id: string;
  experienceId: string;
  userId: string;
  status: BookingStatus;
  date: string;
  guests: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  experience?: Experience;
};

export type Membership = {
  id: string;
  userId: string;
  tier: MembershipTier;
  status: "active" | "expired" | "cancelled";
  expiresAt?: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  updatedAt: string;
};

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };
