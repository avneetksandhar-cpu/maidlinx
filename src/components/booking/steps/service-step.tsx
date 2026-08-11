"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { getActiveServices, getRequiredQuestionsForService } from "@/lib/services";
import type { BookingFormState } from "@/lib/validations/booking-flow";
import { Heading } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ServiceStepProps {
  form: BookingFormState;
  onChange: (value: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
}

export function ServiceStep({ form, onChange, errors }: ServiceStepProps) {
  const services = getActiveServices().filter((s) => s.pricingModel === "instant");

  return (
    <MotionReveal>
      <Heading as="h2" className="text-2xl">
        Choose your cleaning type
      </Heading>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() =>
              onChange({
                serviceType: service.legacyServiceType as BookingFormState["serviceType"],
              })
            }
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              form.serviceType === service.legacyServiceType
                ? "border-ink bg-ink text-white"
                : "border-border hover:border-ink/30",
            )}
          >
            <p className="font-semibold">{service.name}</p>
            <p
              className={cn(
                "mt-1 text-sm",
                form.serviceType === service.legacyServiceType
                  ? "text-white/80"
                  : "text-ink-muted",
              )}
            >
              {service.description}
            </p>
          </button>
        ))}
      </div>
      {form.serviceType ? (
        <p className="mt-3 text-xs text-ink-muted">
          {getRequiredQuestionsForService(form.serviceType).filter((q) => q.required).length}{" "}
          required details for this service (collected in booking steps).
        </p>
      ) : null}
      {errors.serviceType ? (
        <p className="mt-2 text-sm text-error">{errors.serviceType}</p>
      ) : null}
    </MotionReveal>
  );
}
