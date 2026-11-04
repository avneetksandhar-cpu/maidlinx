"use client";

import { CartIcon } from "@/components/icons";
import { useCartCount } from "@/lib/cart/use-cart";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function CartButton({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const count = useCartCount();
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center",
        tone === "light" ? "text-neutral-950" : "text-ink",
      )}
    >
      <CartIcon className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2B8A] px-1 text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
