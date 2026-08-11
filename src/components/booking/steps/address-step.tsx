"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { Heading, Text } from "@/components/ui";
import type { BookingFormState } from "@/lib/validations/booking-flow";

interface AddressStepProps {
  form: BookingFormState;
  onChange: (value: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
}

export function AddressStep({ form, onChange, errors }: AddressStepProps) {
  return (
    <MotionReveal>
      <Heading as="h2" className="text-2xl">
        Where should we clean?
      </Heading>
      <Text muted className="mt-2">
        Enter your cleaning address and pick a suggestion — city and postal code fill in for you.
      </Text>
      <div className="mt-6">
        <AddressAutocomplete
          value={form}
          onChange={(value) => onChange(value)}
          errors={errors}
        />
      </div>
    </MotionReveal>
  );
}
