import { NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/api/http";
import { getStripeCustomerId, listEmergencyContacts } from "@/lib/account/queries";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;

  const extras = await withUserContext(user, async (client) => ({
    emergencyContacts: await listEmergencyContacts(client, user.id),
    stripeCustomerId: await getStripeCustomerId(client, user.id),
  }));

  return NextResponse.json({
    profile: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    },
    emergencyContacts: extras.emergencyContacts,
    stripeCustomerLinked: Boolean(extras.stripeCustomerId),
    stripeMode: "test",
  });
}
