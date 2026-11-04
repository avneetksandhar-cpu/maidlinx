import { RequestForm } from "@/features/requests/components/RequestForm";
import { Suspense } from "react";

export default function RequestPage() {
  return (
    <Suspense>
      <RequestForm />
    </Suspense>
  );
}
