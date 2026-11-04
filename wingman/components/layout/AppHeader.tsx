"use client";

import { WingmanWordmark } from "@/components/brand/WingmanLogo";
import { BackIcon, BellIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type AppHeaderProps = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  rightAction?: ReactNode;
  className?: string;
  tone?: "dark" | "light";
};

const menuLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/about", label: "About Wingman" },
  { href: "/bookings", label: "Tonight" },
  { href: "/profile", label: "Profile" },
];

export function AppHeader({
  title,
  showBack = false,
  backHref,
  showMenu = false,
  showNotifications = false,
  notificationCount = 0,
  rightAction,
  className,
  tone = "dark",
}: AppHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleBack() {
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  }

  const brandHeader = !title && !showBack;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 flex items-center justify-between py-3",
          tone === "light" ? "glass-chrome-light text-neutral-950" : "glass-chrome",
          "pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          className,
        )}
      >
        <div className="flex min-w-[2.75rem] items-center">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className={cn(
                "press-spring flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                tone === "light"
                  ? "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                  : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              <BackIcon />
            </button>
          ) : showMenu || brandHeader ? (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="press-spring flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface"
            >
              <MenuIcon />
            </button>
          ) : null}
        </div>

        {title ? (
          <h1
            className={cn(
              "flex-1 text-center text-base font-semibold tracking-tight",
              tone === "light" ? "text-neutral-950" : "text-ink",
            )}
          >
            {title}
          </h1>
        ) : (
          <Link href="/discover" className="flex flex-1 items-center justify-center" aria-label="Discover">
            <WingmanWordmark logoSize={26} />
          </Link>
        )}

        <div className="flex min-w-[2.75rem] items-center justify-end">
          {rightAction ??
            (showNotifications || brandHeader ? (
              <Link
                href="/messages"
                aria-label="Notifications"
                className="press-spring relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface"
              >
                <BellIcon />
                {notificationCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
                ) : null}
              </Link>
            ) : null)}
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] flex justify-center bg-black/70" role="dialog" aria-label="Menu">
          <div className="relative flex h-full w-full max-w-[430px] flex-col bg-background px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] md:max-w-[720px]">
            <div className="flex items-center justify-between py-2">
              <WingmanWordmark logoSize={26} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="press-spring flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-lg font-medium text-ink hover:bg-surface"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-auto pb-10 text-center text-[0.8rem] text-ink-subtle">
              Someone local has you covered.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
