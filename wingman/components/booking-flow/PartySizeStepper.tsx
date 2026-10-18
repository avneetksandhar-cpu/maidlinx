"use client";

export function PartySizeStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-8">
        <button
          type="button"
          aria-label="Fewer guests"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-[22px] text-white"
        >
          −
        </button>
        <p className="min-w-14 text-center text-[56px] font-medium leading-none tracking-[-0.03em] text-white">
          {value}
        </p>
        <button
          type="button"
          aria-label="More guests"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-[22px] text-white"
        >
          +
        </button>
      </div>
      <p className="mt-4 text-[13px] text-white/45">guests</p>
    </div>
  );
}
