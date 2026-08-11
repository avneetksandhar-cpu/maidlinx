"use client";

import { useEffect, useState } from "react";

/**
 * Returns whether the viewport is below `breakpoint`.
 * `null` until the first client measurement (avoids desktop redirect flash on mobile).
 */
export function useIsMobile(breakpoint = 1024): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
  });

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
