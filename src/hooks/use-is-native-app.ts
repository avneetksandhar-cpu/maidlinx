"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native/is-native-app";

/**
 * Client-only native/app shell detection. Starts null until mounted
 * to avoid SSR/client mismatch.
 */
export function useIsNativeApp(): boolean | null {
  const [native, setNative] = useState<boolean | null>(null);

  useEffect(() => {
    setNative(isNativeApp());
  }, []);

  return native;
}
