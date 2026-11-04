import type { PoolClient } from "pg";

export async function writeAudit(
  client: PoolClient,
  args: {
    actorId: string | null;
    entityType: string;
    entityId: string;
    action: string;
    fromState?: string | null;
    toState?: string | null;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, from_state, to_state, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      args.actorId,
      args.entityType,
      args.entityId,
      args.action,
      args.fromState ?? null,
      args.toState ?? null,
      JSON.stringify(args.payload ?? {}),
    ],
  );
}
