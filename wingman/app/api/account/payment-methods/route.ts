import { NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/api/http";
import { getStripeCustomerId } from "@/lib/account/queries";
import { listStripeCardMethods } from "@/lib/account/stripe-receipt";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;

  const customerId = await withUserContext(user, (client) => getStripeCustomerId(client, user.id));
  const methods = await listStripeCardMethods(customerId);

  return NextResponse.json({
    methods,
    stripeCustomerLinked: Boolean(customerId),
    stripeMode: "test",
  });
}
