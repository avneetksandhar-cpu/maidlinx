import type { UserRole, BookingStatus, ServiceType } from "./database.types";

export type { Profile, Address, Professional, Booking, Review } from "./database.types";

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface SessionContext {
  userId: string;
  role: UserRole;
}

export interface MarketplaceMetrics {
  activeProfessionals: number;
  completedBookings: number;
  averageRating: number;
}

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  serviceType: ServiceType;
  scheduledAt: string;
  totalCents: number;
}
