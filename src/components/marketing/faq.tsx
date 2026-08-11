"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container, Heading } from "@/components/ui";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How is pricing calculated?",
    answer:
      "Your estimate is based on home size, number of bedrooms and bathrooms, cleaning type, and any extras you add. The price you see is verified on our servers before checkout.",
  },
  {
    question: "Are your cleaners vetted?",
    answer:
      "Yes. Every professional on MaidLinx passes a background check and maintains a customer review profile.",
  },
  {
    question: "What if I'm not satisfied?",
    answer:
      "Contact our support team within 24 hours of your service. We'll work with you and your cleaner to make it right.",
  },
  {
    question: "How does payment work?",
    answer:
      "You pay a deposit to confirm your booking. The remaining balance is charged after your clean is complete.",
  },
  {
    question: "Can I reschedule?",
    answer:
      "Yes. Contact support or use your booking confirmation link to request a new date, subject to availability.",
  },
] as const;

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border bg-surface-muted py-16 lg:py-20">
      <Container className="max-w-3xl">
        <Heading as="h2" className="text-center text-3xl">
          Frequently asked questions
        </Heading>
        <dl className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="rounded-lg border border-border bg-surface">
                <dt>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-ink">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-ink-muted transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </dt>
                {isOpen ? (
                  <dd className="border-t border-border px-5 py-4 text-sm leading-6 text-ink-muted">
                    {faq.answer}
                  </dd>
                ) : null}
              </div>
            );
          })}
        </dl>
      </Container>
    </section>
  );
}
