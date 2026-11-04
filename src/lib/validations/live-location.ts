import { z } from "zod";

export const cleanerLiveLocationUpdateSchema = z.object({
  lat: z.number().finite().gte(-90).lte(90),
  lng: z.number().finite().gte(-180).lte(180),
  accuracy: z.number().finite().nonnegative().max(50_000).optional(),
  /** Client clock hint; server stores authoritative updated_at. */
  timestamp: z.string().datetime().optional(),
});

export type CleanerLiveLocationUpdate = z.infer<typeof cleanerLiveLocationUpdateSchema>;
