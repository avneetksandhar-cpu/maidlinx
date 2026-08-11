import { redirect } from "next/navigation";
import { bookingStatusPath } from "@/lib/bookings/booking-routes";

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

/** Legacy confirmation URL → post-payment matching / status route. */
export default async function ConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  redirect(bookingStatusPath(id, token));
}
