"use client";

import { PropertyTypeCards } from "@/components/booking/property-type-cards";
import type { PropertyTypeId } from "@/config/property-types";

interface PropertySelectorProps {
  value?: PropertyTypeId;
  onChange: (value: PropertyTypeId) => void;
  error?: string;
  hideLegend?: boolean;
}

/** @deprecated Prefer PropertyTypeCards directly */
export function PropertySelector({ value, onChange, error }: PropertySelectorProps) {
  return <PropertyTypeCards value={value} onChange={onChange} error={error} />;
}
