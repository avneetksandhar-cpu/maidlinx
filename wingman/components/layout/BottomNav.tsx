"use client";

import { CartIcon, HomeIcon, ProfileIcon, SearchIcon } from "@/components/icons";
import { useCartCount } from "@/lib/cart/use-cart";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match?: string[];
  icon: (active: boolean) => React.ReactNode;
  badge?: number;
};

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();

  const navItems: NavItem[] = [
    {
      href: "/home",
      label: "Home",
      match: ["/home"],
      icon: (active) => <HomeIcon active={active} />,
    },
    {
      href: "/events",
      label: "Search",
      match: ["/events", "/experiences"],
      icon: (active) => <SearchIcon active={active} />,
    },
    {
      href: "/cart",
      label: "Cart",
      icon: (active) => <CartIcon active={active} />,
      badge: cartCount,
    },
    {
      href: "/profile",
      label: "Profile",
      match: ["/profile", "/account", "/receipts"],
      icon: (active) => <ProfileIcon active={active} />,
    },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="absolute bottom-0 left-0 z-50 w-full border-t border-white/[0.08] bg-black"
    >
      <div className="flex items-stretch justify-around px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        {navItems.map((item) => {
          const paths = item.match ?? [item.href];
          const active = paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1",
                active ? "text-white" : "text-white/40",
              )}
            >
              {item.icon(active)}
              {item.badge ? (
                <span className="absolute right-[18%] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2B8A] px-1 text-[10px] font-bold text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
