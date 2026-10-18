"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { ImageSelectionCard } from "@/components/booking-flow/ImageSelectionCard";
import { EXPERIENCE_OPTIONS, STEP_PATHS } from "@/lib/booking-flow/copy";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { ATMOSPHERE_PHOTOS } from "@/lib/photos/atmosphere";
import { useRouter } from "next/navigation";
import { useStepGate } from "@/features/booking-flow/useStepGate";

export function ExperienceScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("experience");
  const { patch } = useNightBooking();
  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <BookingStepShell
      title="What are you in the mood for?"
      step={2}
      backHref={STEP_PATHS.when}
      cta="Continue"
      ctaDisabled={!state.experienceType}
      onContinue={() => router.push(STEP_PATHS.vibe)}
    >
      <div className="grid grid-cols-2 gap-4">
        {EXPERIENCE_OPTIONS.map((option) => {
          const photo = ATMOSPHERE_PHOTOS.find((item) => item.id === option.imageId) ?? ATMOSPHERE_PHOTOS[0];
          return (
            <ImageSelectionCard
              key={option.id}
              title={option.label}
              imageSrc={photo.src}
              imageAlt={photo.alt}
              selected={state.experienceType === option.id}
              onSelect={() => patch({ experienceType: option.id })}
            />
          );
        })}
      </div>
    </BookingStepShell>
  );
}
