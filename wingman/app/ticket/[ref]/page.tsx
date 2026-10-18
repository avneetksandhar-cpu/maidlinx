import { TicketScreen } from "@/features/booking";
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  params: Promise<{ ref: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Ticket ${ref} — Wingman` };
}

function TicketFromPath({ ref }: { ref: string }) {
  return <TicketScreen bookingRef={ref} />;
}

export default async function TicketRefPage({ params }: Props) {
  const { ref } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-ink-muted">
          Loading ticket…
        </div>
      }
    >
      <TicketFromPath ref={decodeURIComponent(ref)} />
    </Suspense>
  );
}
