"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { Heading, Input, Label, Textarea } from "@/components/ui";
import type { BookingFormState } from "@/lib/validations/booking-flow";

interface PropertyStepProps {
  form: BookingFormState;
  onChange: (value: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
}

export function PropertyStep({ form, onChange, errors }: PropertyStepProps) {
  return (
    <MotionReveal>
      <Heading as="h2" className="text-2xl">
        Property details
      </Heading>
      <p className="mt-2 text-sm text-ink-muted">
        Help us size your clean and estimate time on site.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="bedrooms" required>
            Bedrooms
          </Label>
          <Input
            id="bedrooms"
            type="number"
            min={0}
            value={form.bedrooms ?? ""}
            onChange={(e) => onChange({ bedrooms: Number(e.target.value) })}
            invalid={Boolean(errors.bedrooms)}
          />
          {errors.bedrooms ? (
            <p className="mt-1 text-sm text-error">{errors.bedrooms}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="bathrooms" required>
            Bathrooms
          </Label>
          <Input
            id="bathrooms"
            type="number"
            min={1}
            value={form.bathrooms ?? ""}
            onChange={(e) => onChange({ bathrooms: Number(e.target.value) })}
            invalid={Boolean(errors.bathrooms)}
          />
          {errors.bathrooms ? (
            <p className="mt-1 text-sm text-error">{errors.bathrooms}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="squareFootage" required>
            Square footage
          </Label>
          <Input
            id="squareFootage"
            type="number"
            min={200}
            value={form.squareFootage ?? ""}
            onChange={(e) => onChange({ squareFootage: Number(e.target.value) })}
            invalid={Boolean(errors.squareFootage)}
          />
          {errors.squareFootage ? (
            <p className="mt-1 text-sm text-error">{errors.squareFootage}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="notes">Special instructions</Label>
        <Textarea
          id="notes"
          value={form.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Entry instructions, pets, priorities…"
        />
      </div>
    </MotionReveal>
  );
}
