"use client";

import { BackIcon } from "@/components/icons";
import { PhoneFrame } from "@/components/booking-flow/PhoneFrame";
import { ProgressBar } from "@/components/booking-flow/ProgressBar";
import { PrimaryButton } from "@/components/booking-flow/PrimaryButton";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BookingStepShell({
  title,
  subtitle,
  step,
  backHref,
  children,
  cta,
  ctaDisabled,
  ctaLoading,
  onContinue,
  footerNote,
  showProgress = true,
}: {
  title: string;
  subtitle?: string;
  step?: number;
  backHref?: string;
  children: ReactNode;
  cta?: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onContinue?: () => void;
  footerNote?: string;
  showProgress?: boolean;
}) {
  const router = useRouter();

  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col bg-[#050508] text-white">
        <header className="flex items-center justify-between px-6 pt-[max(12px,env(safe-area-inset-top))]">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="flex h-11 w-11 items-center justify-center text-white/80"
          >
            <BackIcon />
          </button>
          {showProgress && step ? <ProgressBar step={step} /> : <span />}
          <span className="w-11" />
        </header>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col px-6 pb-[max(16px,env(safe-area-inset-bottom))]"
        >
          <h1 className="mt-6 text-[22px] font-medium leading-7 tracking-[-0.02em]">{title}</h1>
          {subtitle ? <p className="mt-2 text-[13px] leading-5 text-white/50">{subtitle}</p> : null}
          <div className="mt-8 flex-1">{children}</div>
          {cta && onContinue ? (
            <div className="sticky bottom-0 mt-8 bg-[#050508] pt-4">
              <PrimaryButton onClick={onContinue} disabled={ctaDisabled} loading={ctaLoading}>
                {cta}
              </PrimaryButton>
              {footerNote ? (
                <p className="mt-3 text-center text-[13px] leading-5 text-white/45">{footerNote}</p>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </div>
    </PhoneFrame>
  );
}
