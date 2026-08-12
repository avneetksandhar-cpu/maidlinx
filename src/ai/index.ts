/**
 * MaidLinx AI executive modules (server-side).
 * Isolated from customer UI. First wave: Revenue Director.
 */

export { buildRevenueDirectorBrief } from "@/ai/revenue-director";
export { AI_AGENT_SLOTS } from "@/lib/ai/agents";
export {
  permissionLevelForAction,
  canAutoExecute,
  requiresFounderApproval,
  isHardBlockedAction,
  isFoundationSafeAction,
  AI_OUTBOUND_MESSAGING_AUTO_SEND,
} from "@/lib/ai/permissions";
export { writeAiAuditLog, listAiAuditLog } from "@/lib/ai/audit";
export { requireOwnerSession, requireOwnerAnalyticsAccess } from "@/lib/ai/session";
export { assertAiActionAllowed } from "@/lib/ai/gateway";
export { getAiPauseState, setGlobalAiPause, setAgentPaused } from "@/lib/ai/pause";
export { listAiFeatureFlags, getAiFlag, setAiFlag } from "@/lib/ai/flags";
