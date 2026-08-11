import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireCustomerSession } from "@/lib/dashboard/session";
import {
  createRecurringPlanStub,
  generateDueOccurrences,
  RECURRING_GENERATION_IMPLEMENTED,
} from "@/lib/recurring";
import { z } from "zod";

const createSchema = z.object({
  serviceType: z.string().min(1),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  extras: z.array(z.string()).optional(),
  preferredArrivalWindow: z.string().optional(),
  preferredDayOfWeek: z.number().int().min(0).max(6).optional(),
  marketId: z.string().optional(),
  currency: z.enum(["USD", "CAD"]).optional(),
  addressSnapshot: z.record(z.unknown()),
  sourceBookingId: z.string().uuid().optional(),
  nextOccurrenceDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Recurring plan stubs.
 * Occurrence → booking generation is NOT implemented — responses say so explicitly.
 */
export async function GET() {
  return jsonSuccess({
    generationImplemented: RECURRING_GENERATION_IMPLEMENTED,
    message:
      "Recurring plans can be stored. Automatic booking generation is deferred and not simulated.",
  });
}

export async function POST(request: Request) {
  try {
    const { profile, email } = await requireCustomerSession();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid recurring plan.", 400);
    }

    const plan = await createRecurringPlanStub({
      customerId: profile.id,
      customerEmail: email,
      ...parsed.data,
    });

    const generation = await generateDueOccurrences();

    return jsonSuccess(
      {
        plan,
        generation,
        generationImplemented: RECURRING_GENERATION_IMPLEMENTED,
      },
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create recurring plan.";
    const status = message.includes("Authentication") ? 401 : 400;
    return jsonError(message, status);
  }
}
