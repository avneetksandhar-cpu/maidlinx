export const USER_ROLES = ["member", "partner", "admin", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Product RBAC. Sprint 1 DB roles stay unchanged so seed logins keep working. */
export const PRODUCT_ROLES = ["customer", "wingman", "operator", "admin"] as const;
export type ProductRole = (typeof PRODUCT_ROLES)[number];

export function toProductRole(role: UserRole): ProductRole {
  switch (role) {
    case "member":
      return "customer";
    case "partner":
      return "wingman";
    case "admin":
      return "operator";
    case "owner":
      return "admin";
  }
}

export function dbRolesForProduct(role: ProductRole): UserRole[] {
  switch (role) {
    case "customer":
      return ["member"];
    case "wingman":
      return ["partner"];
    case "operator":
      return ["admin", "owner"];
    case "admin":
      return ["owner"];
  }
}

export const MEMBERSHIP_TIERS = ["basic", "preferred", "premium"] as const;
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number];

export const APPROVAL_STATUSES = [
  "unverified",
  "verified",
  "approved",
  "suspended",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type PermissionFlags = {
  guestList: boolean;
  hostExperiences: boolean;
  manageAttendees: boolean;
  promoteEvents: boolean;
  manageClients: boolean;
  editUsers: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  productRole: ProductRole;
  membershipTier: MembershipTier;
  approvalStatus: ApprovalStatus;
  permissions: PermissionFlags;
};

export const DEFAULT_PERMISSIONS: Record<UserRole, PermissionFlags> = {
  member: {
    guestList: false,
    hostExperiences: false,
    manageAttendees: false,
    promoteEvents: false,
    manageClients: false,
    editUsers: false,
  },
  partner: {
    guestList: false,
    hostExperiences: true,
    manageAttendees: true,
    promoteEvents: true,
    manageClients: true,
    editUsers: false,
  },
  admin: {
    guestList: true,
    hostExperiences: true,
    manageAttendees: true,
    promoteEvents: true,
    manageClients: true,
    editUsers: true,
  },
  owner: {
    guestList: true,
    hostExperiences: true,
    manageAttendees: true,
    promoteEvents: true,
    manageClients: true,
    editUsers: true,
  },
};

export function parsePermissions(value: unknown): PermissionFlags {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    guestList: Boolean(raw.guestList),
    hostExperiences: Boolean(raw.hostExperiences),
    manageAttendees: Boolean(raw.manageAttendees),
    promoteEvents: Boolean(raw.promoteEvents),
    manageClients: Boolean(raw.manageClients),
    editUsers: Boolean(raw.editUsers),
  };
}

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}
