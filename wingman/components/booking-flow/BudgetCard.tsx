"use client";

import { SelectionCard } from "@/components/booking-flow/SelectionCard";

export function BudgetCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return <SelectionCard title={label} selected={selected} onSelect={onSelect} />;
}
