export type AccountBooking = {
  id: string;
  status: string;
  title: string;
  startsAt: string;
  createdAt: string;
  eventId: string | null;
  eventExternalId: string | null;
  source: string;
  canBookAgain: boolean;
  amountCents: number | null;
  testLabel: string | null;
  paymentStatus: string | null;
  last4: string | null;
  brand: string | null;
  receiptUrl: string | null;
  paymentId: string | null;
  paidAt: string | null;
};

export type AccountPayload = {
  profile: { displayName: string | null; email: string; role: string };
  upcoming: AccountBooking | null;
  bookings: AccountBooking[];
  receipts: AccountBooking[];
  payment: { last4: string | null; brand: string | null; source: string } | null;
  emergencyContacts: Array<{ id: string; name: string; phone: string | null; email: string | null }>;
  stripeMode: "test";
  emptyCopy: string;
  error?: string;
};

export type AccountInvoice = {
  id: string;
  bookingId: string;
  title: string;
  amountCents: number | null;
  paidAt: string | null;
  createdAt: string;
  last4: string | null;
  brand: string | null;
  receiptUrl: string | null;
  testLabel: string | null;
};

export type AccountCard = {
  id: string;
  brand: string | null;
  last4: string | null;
};

export type ReceiptPayload = {
  id: string;
  title: string;
  status: string;
  amountCents: number | null;
  currency: string;
  createdAt: string;
  startsAt: string;
  paidAt: string | null;
  testLabel: string | null;
  last4: string | null;
  brand: string | null;
  receiptUrl: string | null;
  stripeMode: "test";
  customer: { displayName: string | null; email: string };
  error?: string;
};
