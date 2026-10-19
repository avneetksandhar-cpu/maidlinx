/** Visual tokens for the mobile booking engine. Scoped — do not restyle operator desks. */
export const bookingTheme = {
  background: "#050508",
  surface: "#121216",
  surfaceElevated: "#1A1A21",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA8",
  border: "rgba(255,255,255,0.10)",
  brandBlue: "#00C2FF",
  brandPink: "#FF2BD6",
  brandPurple: "#8B5CFF",
  vipGold: "#C9A227",
  success: "#2EE59D",
  radius: 18,
  radiusCard: 20,
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    display: "1.75rem",
    title: "1.65rem",
    body: "0.95rem",
    caption: "0.75rem",
  },
  motionMs: 220,
} as const;

export type BookingTheme = typeof bookingTheme;
