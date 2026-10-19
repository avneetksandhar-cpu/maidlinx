import { BookNightScreen } from "@/features/booking/components/BookNightScreen";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Book $500",
  description: "Start-the-night Wingman service. $500 server total.",
};

export default function BookPage() {
  return (
    <Suspense>
      <BookNightScreen />
    </Suspense>
  );
}
