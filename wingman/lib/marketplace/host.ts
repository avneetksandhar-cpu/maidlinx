import {
  ASSIGNED_HOST_NAME,
  MORE_WINGMEN_NOTE,
  OPERATOR_SLOT_BIO,
  OPERATOR_SLOT_SPECIALTY,
  YOUR_WINGMAN_DISPLAY_NAME,
} from "@/lib/marketplace/host-copy";
import { getSql } from "@/lib/neon";

export {
  ASSIGNED_HOST_NAME,
  MORE_WINGMEN_NOTE,
  NIGHT_SERVICE_TERMS,
  OPERATOR_SLOT_BIO,
  OPERATOR_SLOT_SPECIALTY,
  YOUR_WINGMAN_DISPLAY_NAME,
} from "@/lib/marketplace/host-copy";

export type OperatorSlot = {
  id: string;
  hostName: typeof ASSIGNED_HOST_NAME;
  displayName: typeof YOUR_WINGMAN_DISPLAY_NAME;
  unpublished: true;
  publicVerified: false;
  governmentIdVerified: false;
  photoUrl: null;
  note: string;
};

export async function ensureOperatorWingmanSlot(): Promise<OperatorSlot> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id
    FROM wingmen
    WHERE ${OPERATOR_SLOT_SPECIALTY} = ANY(specialties)
       OR (
         display_name IN (${ASSIGNED_HOST_NAME}, ${YOUR_WINGMAN_DISPLAY_NAME}, 'Your Wingman')
         AND COALESCE(is_test_fixture, false) = false
       )
    ORDER BY created_at ASC
    LIMIT 1
  `) as Array<{ id: string }>;

  if (existing[0]) {
    await sql`
      UPDATE wingmen
      SET display_name = ${ASSIGNED_HOST_NAME},
          photo_url = NULL,
          specialties = CASE
            WHEN ${OPERATOR_SLOT_SPECIALTY} = ANY(specialties) THEN specialties
            ELSE array_append(specialties, ${OPERATOR_SLOT_SPECIALTY})
          END,
          biography = ${OPERATOR_SLOT_BIO},
          verification_status = 'pending',
          updated_at = now()
      WHERE id = ${existing[0].id}
    `;
    return toSlot(existing[0].id);
  }

  const inserted = (await sql`
    INSERT INTO wingmen (
      display_name, photo_url, specialties, areas, languages, biography, verification_status
    ) VALUES (
      ${ASSIGNED_HOST_NAME},
      NULL,
      ARRAY[${OPERATOR_SLOT_SPECIALTY}]::text[],
      ARRAY['Miami']::text[],
      '{}',
      ${OPERATOR_SLOT_BIO},
      'pending'
    )
    RETURNING id
  `) as Array<{ id: string }>;

  return toSlot(inserted[0].id);
}

function toSlot(id: string): OperatorSlot {
  return {
    id,
    hostName: ASSIGNED_HOST_NAME,
    displayName: YOUR_WINGMAN_DISPLAY_NAME,
    unpublished: true,
    publicVerified: false,
    governmentIdVerified: false,
    photoUrl: null,
    note: MORE_WINGMEN_NOTE,
  };
}

export function publicOperatorAssignment(slot: Pick<OperatorSlot, "displayName" | "hostName" | "note">) {
  return {
    hostName: slot.hostName ?? ASSIGNED_HOST_NAME,
    displayName: slot.displayName,
    unpublished: true as const,
    publicVerified: false as const,
    governmentIdVerified: false as const,
    photoUrl: null,
    reviews: [] as const,
    note: slot.note,
  };
}
