"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LOGIN_PHOTO = "/photos/login-opening.jpg";
const SPLASH_MS = 2700;
const REDUCED_MS = 1100;

/** Opening brand reveal. `/` renders this, then the live login screen. */
export function LandingSplash() {
  const router = useRouter();

  useEffect(() => {
    const photo = new window.Image();
    photo.src = LOGIN_PHOTO;
    router.prefetch("/auth");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => router.replace("/auth"), reduce ? REDUCED_MS : SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="wm-splash">
      <div className="wm-splash-glow" aria-hidden />
      <div className="wm-splash-mark">
        <Image
          src="/brand/logo.png"
          alt="Wingman"
          width={609}
          height={908}
          priority
          className="wm-splash-logo"
          draggable={false}
        />
      </div>
    </main>
  );
}
