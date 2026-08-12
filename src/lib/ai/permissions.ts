/**
 * GREEN / YELLOW / RED permission matrix for AI executive actions.
 * Default for outbound messaging: recommend-only (not GREEN send).
 * Autonomy ladder: simulation → recommend → approval → GREEN-only later.
 * No RED autonomy.
 */

import type { AiActionKind, AiPermissionLevel } from "@/lib/ai/types";

const ACTION_LEVELS: Record<AiActionKind, AiPermissionLevel> = {
  "brief.generate": "green",
  "opportunity.rank": "green",
  "analytics.read": "green",
  "reminder.recommend": "green",
  "message.recommend": "yellow",
  "campaign.send": "red",
  "pricing.change": "red",
  "refund.issue": "red",
  "payout.change": "red",
  "contract.sign": "red",
  "legal.action": "red",
  "safety.action": "red",
  "bank.change": "red",
};

/** Outbound customer messaging stays OFF for auto-send in V0 / foundation. */
export const AI_OUTBOUND_MESSAGING_AUTO_SEND = false;

/** Actions that never auto-execute regardless of level helpers. */
export const AI_HARD_BLOCKED_ACTIONS: ReadonlySet<AiActionKind> = new Set([
  "campaign.send",
  "pricing.change",
  "refund.issue",
  "payout.change",
  "contract.sign",
  "legal.action",
  "safety.action",
  "bank.change",
]);

export function permissionLevelForAction(action: AiActionKind): AiPermissionLevel {
  return ACTION_LEVELS[action];
}

export function canAutoExecute(level: AiPermissionLevel): boolean {
  return level === "green";
}

export function requiresFounderApproval(level: AiPermissionLevel): boolean {
  return level === "red";
}

export function isHardBlockedAction(action: AiActionKind): boolean {
  return AI_HARD_BLOCKED_ACTIONS.has(action);
}

/** True when action may run without founder approval in foundation (analytics/recommends). */
export function isFoundationSafeAction(action: AiActionKind): boolean {
  if (isHardBlockedAction(action)) return false;
  const level = permissionLevelForAction(action);
  return level === "green" || level === "yellow";
}

export function describePermissionLevel(level: AiPermissionLevel): string {
  switch (level) {
    case "green":
      return "AI may act automatically (safe analytics / reporting / internal recommends).";
    case "yellow":
      return "AI may prepare within predefined limits; founder review recommended.";
    case "red":
      return "Founder must approve before any material action.";
  }
}
