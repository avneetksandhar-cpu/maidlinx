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
  AI_OUTBOUND_MESSAGING_AUTO_SEND,
} from "@/lib/ai/permissions";
export { writeAiAuditLog, listAiAuditLog } from "@/lib/ai/audit";
export { requireOwnerSession, requireOwnerAnalyticsAccess } from "@/lib/ai/session";
