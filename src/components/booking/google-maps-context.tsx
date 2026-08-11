"use client";

import { createContext, useContext } from "react";

export type GoogleMapsStatus = "missing-key" | "loading" | "ready" | "error";

export interface GoogleMapsContextValue {
  apiKey: string | undefined;
  status: GoogleMapsStatus;
  isReady: boolean;
}

export const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  apiKey: undefined,
  status: "missing-key",
  isReady: false,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
