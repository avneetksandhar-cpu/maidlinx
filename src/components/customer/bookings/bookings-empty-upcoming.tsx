import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { routes } from "@/config/site";

export function BookingsEmptyUpcoming() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-16 text-center">
      <div
        className="relative flex size-[4.5rem] items-center justify-center rounded-2xl border border-[#E2E8EE] bg-[#F7FBFC]"
        aria-hidden
      >
        <CalendarDays className="size-9 text-[#01193D]/70" strokeWidth={1.5} />
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#04CED2] text-[11px] font-bold text-[#01193D]">
          +
        </span>
      </div>
      <h2 className="mt-5 text-[1.15rem] font-bold tracking-tight text-[#01193D]">
        No upcoming cleans
      </h2>
      <Link
        href={routes.book}
        className="mt-6 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[#04CED2] text-[16px] font-semibold text-[#01193D] transition-opacity hover:opacity-95"
      >
        Book a clean
      </Link>
    </div>
  );
}
