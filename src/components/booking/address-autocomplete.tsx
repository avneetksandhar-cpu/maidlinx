"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { useGoogleMaps } from "@/components/booking/google-maps-context";
import { Button, Input, Label } from "@/components/ui";
import {
  formatAddressSummary,
  hasStructuredPlace,
  structuredToBookingAddress,
} from "@/lib/addresses/map";
import {
  ensureGoogleMapsLoaded,
  geolocationErrorReason,
  LOCATION_FINDING_MESSAGE,
  locationFailureMessage,
  parsePlacesNewAddress,
  queryGeolocationPermission,
  reverseGeocodeLatLng,
} from "@/lib/addresses/geolocation";
import type { SavedAddress, StructuredAddress } from "@/lib/addresses/types";
import type { Step1Address } from "@/lib/validations/booking-flow";
import { cn } from "@/lib/utils";
import { trackBookingEvent } from "@/lib/analytics/booking";
import {
  pushRecentGuestAddress,
  readRecentGuestAddresses,
  type RecentGuestAddress,
} from "@/lib/bookings/usual-clean";

interface AddressAutocompleteProps {
  value: Partial<Step1Address>;
  onChange: (value: Partial<Step1Address> | Step1Address) => void;
  errors?: Partial<Record<keyof Step1Address, string>>;
  className?: string;
  /** Hero / search field label override */
  label?: string;
  placeholder?: string;
  /** Compact hero search styling */
  variant?: "default" | "hero";
  /** Called after a structured place is chosen (Places or saved/recent). */
  onAddressSelected?: (address: Partial<Step1Address>) => void;
}

/** Normalized Places API (New) suggestion for the dropdown. */
type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  placePrediction: google.maps.places.PlacePrediction;
};

type DropdownItem =
  | { kind: "saved"; address: SavedAddress }
  | { kind: "recent"; address: StructuredAddress }
  | { kind: "guest-recent"; address: RecentGuestAddress }
  | { kind: "prediction"; prediction: PlaceSuggestion }
  | { kind: "current-location" };

function guestRecentToStructured(address: RecentGuestAddress): StructuredAddress {
  return {
    formattedAddress: address.formattedAddress,
    addressLine1: address.line1,
    unit: address.line2,
    city: address.city,
    region: address.state,
    postalCode: address.postalCode,
    country: address.country,
    countryCode: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
    placeId: address.googlePlaceId,
  };
}

function rememberGuestAddress(address: Partial<Step1Address>) {
  if (!address.line1 || !address.city || !address.state || !address.postalCode) return;
  pushRecentGuestAddress({
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country ?? "US",
    latitude: address.latitude,
    longitude: address.longitude,
    googlePlaceId: address.googlePlaceId,
    formattedAddress: address.formattedAddress,
    label: "Recent",
  });
}

function parsedToBookingAddress(
  parsed: NonNullable<ReturnType<typeof parsePlacesNewAddress>>,
  existingLine2?: string,
): Partial<Step1Address> {
  return {
    line1: parsed.addressLine1,
    line2: parsed.unit || existingLine2 || undefined,
    city: parsed.city,
    state: parsed.region,
    postalCode: parsed.postalCode,
    country: parsed.country || "US",
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    googlePlaceId: parsed.placeId,
    formattedAddress: parsed.formattedAddress,
    streetNumber: parsed.streetNumber,
    route: parsed.route,
  };
}

function mergeAddress(
  value: Partial<Step1Address>,
  patch: Partial<Step1Address>,
  options?: { clearPlaceMeta?: boolean },
): Partial<Step1Address> {
  return {
    line1: patch.line1 ?? value.line1 ?? "",
    line2: patch.line2 !== undefined ? patch.line2 : value.line2,
    city: patch.city ?? value.city ?? "",
    state: patch.state ?? value.state ?? "",
    postalCode: patch.postalCode ?? value.postalCode ?? "",
    country: patch.country ?? value.country ?? "US",
    latitude: options?.clearPlaceMeta ? undefined : (patch.latitude ?? value.latitude),
    longitude: options?.clearPlaceMeta ? undefined : (patch.longitude ?? value.longitude),
    googlePlaceId: options?.clearPlaceMeta
      ? undefined
      : (patch.googlePlaceId ?? value.googlePlaceId),
    formattedAddress: options?.clearPlaceMeta
      ? undefined
      : (patch.formattedAddress ?? value.formattedAddress),
    streetNumber: options?.clearPlaceMeta
      ? undefined
      : (patch.streetNumber ?? value.streetNumber),
    route: options?.clearPlaceMeta ? undefined : (patch.route ?? value.route),
  };
}

/** Bias Places API (New) autocomplete toward MaidLinx markets when hints are present. */
function predictionLocationBias(
  input: string,
): NonNullable<google.maps.places.AutocompleteRequest["locationBias"]> {
  const text = input.toLowerCase();
  const looksCanadian =
    /[a-z]\d[a-z]/.test(text) ||
    /\b(on|ontario|toronto|mississauga|brampton|vaughan|markham|oakville|gta)\b/.test(text);
  if (looksCanadian) {
    return { center: { lat: 43.6532, lng: -79.3832 }, radius: 90_000 };
  }

  const looksSouthFlorida =
    /\b(fl|florida|miami|fort lauderdale|ft lauderdale|boca|west palm|broward|miami-dade|palm beach)\b/.test(
      text,
    );
  if (looksSouthFlorida) {
    return { center: { lat: 26.1224, lng: -80.1373 }, radius: 90_000 };
  }

  // Default: prefer GTA (primary market); FL still returned via region codes.
  return { center: { lat: 43.6532, lng: -79.3832 }, radius: 120_000 };
}

function isDev() {
  return process.env.NODE_ENV === "development";
}

export function AddressAutocomplete({
  value,
  onChange,
  errors,
  className,
  label = "Cleaning address",
  placeholder = "Where do you need cleaning?",
  variant = "default",
  onAddressSelected,
}: AddressAutocompleteProps) {
  const maps = useGoogleMaps();
  const rawKey = maps.apiKey ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const apiKey = rawKey?.trim() ? rawKey.trim() : undefined;
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const predictionRequestRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  const [localReady, setLocalReady] = useState(false);
  const [predictions, setPredictions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [manualExpanded, setManualExpanded] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentAddress, setRecentAddress] = useState<StructuredAddress | null>(null);
  const [guestRecent, setGuestRecent] = useState<RecentGuestAddress[]>(() =>
    typeof window === "undefined" ? [] : readRecentGuestAddresses(),
  );
  const [savedLoading, setSavedLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [startedTracked, setStartedTracked] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locatingRef = useRef(false);
  const permissionDeniedRef = useRef(false);
  const onAddressSelectedRef = useRef(onAddressSelected);

  useEffect(() => {
    onAddressSelectedRef.current = onAddressSelected;
  }, [onAddressSelected]);

  const isReady = maps.isReady || localReady;
  const structuredSelected = hasStructuredPlace(value);
  const status: "missing-key" | "loading" | "ready" | "error" = !apiKey
    ? "missing-key"
    : isReady
      ? "ready"
      : maps.status === "error"
        ? "error"
        : "loading";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!apiKey && isDev()) {
      console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing");
    }
  }, [apiKey]);

  useEffect(() => {
    if (status === "error" && isDev()) {
      console.error(
        "[Google Maps] Places unavailable — autocomplete disabled; manual address entry still works.",
      );
    }
  }, [status]);

  useEffect(() => {
    if (!apiKey || isReady) return;

    const interval = window.setInterval(() => {
      if (
        window.google?.maps?.places &&
        typeof google.maps.places.AutocompleteSuggestion?.fetchAutocompleteSuggestions ===
          "function"
      ) {
        setLocalReady(true);
        window.clearInterval(interval);
      }
    }, 200);

    const timeout = window.setTimeout(() => window.clearInterval(interval), 15000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [apiKey, isReady]);

  const loadSavedPlaces = useCallback(async () => {
    setSavedLoading(true);
    try {
      const response = await fetch("/api/dashboard/addresses", { credentials: "include" });
      if (response.status === 401) {
        setIsAuthenticated(false);
        setSavedAddresses([]);
        setRecentAddress(null);
        return;
      }
      if (!response.ok) return;
      const payload = (await response.json()) as {
        data?: { addresses?: SavedAddress[]; recent?: StructuredAddress | null };
      };
      setIsAuthenticated(true);
      setSavedAddresses(payload.data?.addresses ?? []);
      setRecentAddress(payload.data?.recent ?? null);
    } catch {
      // Guests / offline — autocomplete still works without saved places.
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    // Optional enrichment for signed-in customers; guests ignore failures.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch for saved addresses
    void loadSavedPlaces();
  }, [loadSavedPlaces]);

  const ensureSessionToken = useCallback(() => {
    if (!window.google?.maps?.places) return null;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const placesNewReady = useCallback(() => {
    return Boolean(
      window.google?.maps?.places &&
        typeof google.maps.places.AutocompleteSuggestion?.fetchAutocompleteSuggestions ===
          "function",
    );
  }, []);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!isReady || !placesNewReady()) {
        setPredictions([]);
        return;
      }

      const trimmed = input.trim();
      if (trimmed.length < 2) {
        setPredictions([]);
        setLoadingPredictions(false);
        setNoResults(false);
        return;
      }

      const requestId = ++predictionRequestRef.current;
      setLoadingPredictions(true);
      setPlacesError(null);
      setNoResults(false);
      const sessionToken = ensureSessionToken();

      void (async () => {
        try {
          const { suggestions } =
            await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: trimmed,
              includedRegionCodes: ["us", "ca"],
              includedPrimaryTypes: ["street_address", "route", "premise"],
              sessionToken: sessionToken ?? undefined,
              locationBias: predictionLocationBias(trimmed),
            });

          if (requestId !== predictionRequestRef.current) return;

          const mapped: PlaceSuggestion[] = [];
          for (const suggestion of suggestions ?? []) {
            const prediction = suggestion.placePrediction;
            if (!prediction?.placeId) continue;
            const description =
              prediction.text?.text?.trim() ||
              prediction.mainText?.text?.trim() ||
              trimmed;
            mapped.push({
              placeId: prediction.placeId,
              description,
              mainText: prediction.mainText?.text?.trim() || description,
              secondaryText: prediction.secondaryText?.text?.trim() || undefined,
              placePrediction: prediction,
            });
          }

          setLoadingPredictions(false);
          if (mapped.length) {
            setPredictions(mapped);
            setOpen(true);
            setActiveIndex(-1);
            setNoResults(false);
            return;
          }
          setPredictions([]);
          setNoResults(true);
          setOpen(true);
        } catch (error) {
          if (requestId !== predictionRequestRef.current) return;
          setLoadingPredictions(false);
          setPredictions([]);
          if (isDev()) {
            console.error("[Google Maps] fetchAutocompleteSuggestions failed", error);
          }
          const message = error instanceof Error ? error.message : String(error);
          if (/REQUEST_DENIED|PERMISSION_DENIED|API_KEY|Billing|OVER_QUERY/i.test(message)) {
            setPlacesError(
              "Address suggestions are temporarily unavailable. You can enter your address manually.",
            );
            setManualExpanded(true);
          } else {
            setNoResults(true);
            setOpen(true);
          }
        }
      })();
    },
    [ensureSessionToken, isReady, placesNewReady],
  );

  const selectPrediction = useCallback((prediction: PlaceSuggestion) => {
    setResolvingPlace(true);
    setOpen(false);
    setPredictions([]);
    setPlacesError(null);
    setNoResults(false);

    void (async () => {
      try {
        // Session token is attached automatically on first fetchFields when used with suggestions.
        const place = prediction.placePrediction.toPlace();
        await place.fetchFields({
          fields: ["addressComponents", "formattedAddress", "location", "id", "displayName"],
        });
        sessionTokenRef.current = null;

        const parsed = parsePlacesNewAddress(place, valueRef.current.line2);
        if (!parsed?.addressLine1) {
          onChangeRef.current(
            mergeAddress(valueRef.current, {
              line1: prediction.mainText || prediction.description,
              googlePlaceId: prediction.placeId,
            }),
          );
          setManualExpanded(true);
          setResolvingPlace(false);
          return;
        }

        setManualExpanded(false);
        const next = mergeAddress(valueRef.current, parsedToBookingAddress(parsed));
        onChangeRef.current(next);
        rememberGuestAddress(next);
        trackBookingEvent("address_selected", {
          source: "places",
          placeId: next.googlePlaceId,
        });
        onAddressSelectedRef.current?.(next);
        setGuestRecent(readRecentGuestAddresses());
      } catch (error) {
        if (isDev()) {
          console.error("[Google Maps] Place.fetchFields failed", error);
        }
        onChangeRef.current(
          mergeAddress(valueRef.current, {
            line1: prediction.mainText || prediction.description,
            googlePlaceId: prediction.placeId,
          }),
        );
        setPlacesError("Could not load full address details. Please confirm the fields below.");
        setManualExpanded(true);
      } finally {
        setResolvingPlace(false);
      }
    })();
  }, []);

  const selectStructured = useCallback((address: StructuredAddress, source = "saved") => {
    setOpen(false);
    setPredictions([]);
    setNoResults(false);
    setManualExpanded(false);
    setPlacesError(null);
    const next = mergeAddress(valueRef.current, structuredToBookingAddress(address));
    onChangeRef.current(next);
    rememberGuestAddress(next);
    trackBookingEvent("address_selected", { source, placeId: next.googlePlaceId });
    onAddressSelectedRef.current?.(next);
    setGuestRecent(readRecentGuestAddresses());
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const updateField = (patch: Partial<Step1Address>) => {
    onChange(mergeAddress(value, patch));
  };

  const onLine1Change = (nextLine1: string) => {
    onChange(mergeAddress(value, { line1: nextLine1 }, { clearPlaceMeta: true }));
    setManualExpanded(false);
    setLocationError(null);

    if (!isReady) {
      setPredictions([]);
      setOpen(isAuthenticated && (savedAddresses.length > 0 || Boolean(recentAddress)));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(nextLine1), 200);
  };

  const guestRecentItems: DropdownItem[] = guestRecent.map((address) => ({
    kind: "guest-recent" as const,
    address,
  }));

  const finishLocating = useCallback(() => {
    locatingRef.current = false;
    setLocating(false);
  }, []);

  const locateCurrent = useCallback(async () => {
    // Single in-flight request — avoids spam-clicks re-prompting the browser.
    if (locatingRef.current) return;

    setLocationError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(locationFailureMessage("unsupported"));
      return;
    }

    if (permissionDeniedRef.current) {
      setLocationError(locationFailureMessage("permission_denied"));
      return;
    }

    const permission = await queryGeolocationPermission();
    if (permission === "denied") {
      permissionDeniedRef.current = true;
      setLocationError(locationFailureMessage("permission_denied"));
      return;
    }

    if (!apiKey) {
      // No key configured — reverse geocode cannot run; don't pretend it's "almost ready".
      setLocationError(locationFailureMessage("maps_denied"));
      return;
    }

    locatingRef.current = true;
    setLocating(true);
    setOpen(false);

    // Wait for Maps JS (Places nearby can reverse-geocode when Geocoding API is off).
    const mapsLoad = await ensureGoogleMapsLoaded();
    const placesReady = Boolean(window.google?.maps?.places);
    if (mapsLoad !== "ready" && !placesReady) {
      finishLocating();
      if (isDev()) {
        console.warn("[address] Google Maps not ready after wait", mapsLoad, maps.status);
      }
      const reason =
        mapsLoad === "unavailable" || maps.status === "error" ? "maps_denied" : "maps_unavailable";
      setLocationError(locationFailureMessage(reason));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        void (async () => {
          try {
            const result = await reverseGeocodeLatLng(latLng, {
              existingUnit: valueRef.current.line2,
            });
            finishLocating();
            if (!result.ok) {
              if (isDev()) console.warn("[address] Reverse geocode failed", result.reason);
              setLocationError(locationFailureMessage(result.reason));
              return;
            }

            const address = result.address;
            // Prefer GPS coordinates; keep reverse-geocoded placeId / fields.
            // Customers see the formatted street address — never raw lat/lng.
            const displayAddress =
              address.formattedAddress?.trim() ||
              [address.addressLine1, address.city, address.region].filter(Boolean).join(", ");
            selectStructured(
              {
                formattedAddress: displayAddress,
                addressLine1: address.addressLine1,
                unit: address.unit,
                city: address.city,
                region: address.region,
                postalCode: address.postalCode,
                country: address.country || "US",
                countryCode: address.country || "US",
                latitude: latLng.lat,
                longitude: latLng.lng,
                placeId: address.placeId,
                streetNumber: address.streetNumber,
                route: address.route,
              },
              "current_location",
            );
          } catch (error) {
            finishLocating();
            if (isDev()) console.warn("[address] Reverse geocode exception", error);
            setLocationError(locationFailureMessage("geocode_failed"));
          }
        })();
      },
      (error) => {
        finishLocating();
        const reason = geolocationErrorReason(error);
        if (reason === "permission_denied") {
          permissionDeniedRef.current = true;
        }
        if (isDev()) console.warn("[address] Geolocation denied/failed", error.code);
        setLocationError(locationFailureMessage(reason));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [apiKey, finishLocating, maps.status, selectStructured]);

  const onLine1Focus = () => {
    setOpen(true);
    if (!startedTracked) {
      trackBookingEvent("address_started");
      setStartedTracked(true);
    }
    if ((value.line1?.trim().length ?? 0) < 2) {
      return;
    }
    if (!isReady) return;
    const current = value.line1?.trim() ?? "";
    if (current.length >= 2) {
      fetchPredictions(current);
    }
  };

  const homeSaved = savedAddresses.filter((a) => /home/i.test(a.label));
  const otherSaved = savedAddresses.filter((a) => !/home/i.test(a.label));
  const savedItems: DropdownItem[] = [...homeSaved, ...otherSaved].map((address) => ({
    kind: "saved" as const,
    address,
  }));
  const recentItem: DropdownItem[] =
    recentAddress &&
    !savedAddresses.some(
      (saved) =>
        saved.addressLine1 === recentAddress.addressLine1 &&
        saved.postalCode === recentAddress.postalCode,
    )
      ? [{ kind: "recent" as const, address: recentAddress }]
      : [];
  const predictionItems: DropdownItem[] = predictions.map((prediction) => ({
    kind: "prediction" as const,
    prediction,
  }));

  const query = value.line1?.trim() ?? "";
  const showIdleSection = open && query.length < 2;
  const showPredictionSection = open && isReady && query.length >= 2;
  const idleItems: DropdownItem[] = showIdleSection
    ? [{ kind: "current-location" as const }, ...savedItems, ...recentItem, ...guestRecentItems]
    : [];
  const dropdownItems: DropdownItem[] = showIdleSection
    ? idleItems
    : showPredictionSection
      ? predictionItems
      : [];

  const showSuggestions =
    open &&
    (showIdleSection || showPredictionSection || loadingPredictions || noResults || locating);

  const summaryText =
    value.formattedAddress ||
    [value.line1, value.city, value.state, value.postalCode].filter(Boolean).join(", ");

  const isHero = variant === "hero";

  const activateItem = (item: DropdownItem) => {
    if (item.kind === "current-location") {
      locateCurrent();
      return;
    }
    if (item.kind === "prediction") {
      selectPrediction(item.prediction);
      return;
    }
    if (item.kind === "guest-recent") {
      selectStructured(guestRecentToStructured(item.address), "guest_recent");
      return;
    }
    selectStructured(item.address, item.kind);
  };

  return (
    <div className={cn(isHero ? "space-y-0" : "space-y-5", className)}>
      {placesError && !isHero ? (
        <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted">{placesError}</p>
      ) : null}

      <div ref={rootRef} className="relative z-[80]">
        <Label htmlFor="line1" className={isHero ? "sr-only" : "text-ink-muted"} required={!isHero}>
          {label}
        </Label>
        <div className={cn(isHero && "relative")}>
          {isHero ? (
            <MapPin
              data-hero-pin
              className="pointer-events-none absolute top-1/2 left-4 z-[1] size-5 -translate-y-1/2 text-[var(--maidlinx-green)]"
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
          <Input
            id="line1"
            value={value.line1 ?? ""}
            onChange={(event) => onLine1Change(event.target.value)}
            onFocus={onLine1Focus}
            onKeyDown={(event) => {
              if (!showSuggestions || dropdownItems.length === 0) return;

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => (index + 1) % dropdownItems.length);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => (index <= 0 ? dropdownItems.length - 1 : index - 1));
              } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault();
                const item = dropdownItems[activeIndex];
                if (item) activateItem(item);
              } else if (event.key === "Escape") {
                setOpen(false);
                setActiveIndex(-1);
              }
            }}
            role="combobox"
            aria-expanded={Boolean(showSuggestions)}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            invalid={Boolean(errors?.line1)}
            placeholder={locating ? LOCATION_FINDING_MESSAGE : placeholder}
            autoComplete="off"
            aria-busy={locating || undefined}
            className={cn(
              "rounded-xl border-border transition-shadow duration-200 focus-visible:border-accent focus-visible:ring-accent/35",
              isHero
                ? "booking-input-hero mt-0 border bg-white text-base shadow-soft sm:text-lg"
                : "booking-input-lg mt-2",
            )}
          />
          {isHero && value.line1 ? (
            <button
              type="button"
              aria-label="Clear address"
              className="absolute top-1/2 right-3 z-[1] inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--maidlinx-muted)] transition-colors hover:bg-[var(--maidlinx-mint-soft)] hover:text-[var(--maidlinx-ink)]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onLine1Change("")}
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        {errors?.line1 ? <p className="mt-2 text-sm text-error">{errors.line1}</p> : null}
        {!isHero && resolvingPlace ? (
          <p className="mt-2 text-xs text-ink-subtle">Confirming address…</p>
        ) : null}

        <div className={cn("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1", isHero && "mt-2.5")}>
          <button
            type="button"
            onClick={() => void locateCurrent()}
            disabled={locating}
            aria-busy={locating || undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium transition-colors duration-150 touch-manipulation",
              locating
                ? "cursor-wait text-ink-muted"
                : "text-accent underline-offset-2 hover:underline",
            )}
          >
            {locating ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="size-4 shrink-0" aria-hidden />
            )}
            {locating ? LOCATION_FINDING_MESSAGE : "Use my current location"}
          </button>
        </div>
        {locationError ? (
          <p className="mt-2 text-sm text-ink-muted" role="status" aria-live="polite">
            {locationError}
          </p>
        ) : locating ? (
          <p className="sr-only" role="status" aria-live="polite">
            {LOCATION_FINDING_MESSAGE}
          </p>
        ) : null}

        {showSuggestions ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute inset-x-0 top-full z-[90] mt-1.5 max-h-[min(20rem,55dvh)] w-full overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface py-1.5 shadow-elevated"
          >
            {showIdleSection ? (
              <>
                <li className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-subtle uppercase">
                  Quick picks
                </li>
                {dropdownItems.map((item, index) => {
                  if (item.kind === "prediction") return null;
                  if (item.kind === "current-location") {
                    return (
                      <li key="current-location" role="option" aria-selected={index === activeIndex}>
                        <button
                          type="button"
                          id={`${listboxId}-option-${index}`}
                          disabled={locating}
                          aria-busy={locating || undefined}
                          className={cn(
                            "flex min-h-12 w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 touch-manipulation",
                            index === activeIndex ? "bg-accent-muted" : "hover:bg-surface-muted",
                            locating && "cursor-wait opacity-70",
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => void locateCurrent()}
                        >
                          {locating ? (
                            <Loader2 className="size-5 shrink-0 animate-spin text-accent" aria-hidden />
                          ) : (
                            <LocateFixed className="size-5 shrink-0 text-accent" aria-hidden />
                          )}
                          <span className="text-sm font-medium text-accent sm:text-[15px]">
                            {locating ? LOCATION_FINDING_MESSAGE : "Use my current location"}
                          </span>
                        </button>
                      </li>
                    );
                  }

                  const itemLabel =
                    item.kind === "saved"
                      ? item.address.label || "Home"
                      : item.kind === "recent"
                        ? "Recent"
                        : item.address.label || "Recent";
                  const sectionHint =
                    item.kind === "saved" && /home/i.test(item.address.label)
                      ? "Home"
                      : item.kind === "saved"
                        ? item.address.label
                        : "Recent";
                  const structured =
                    item.kind === "guest-recent"
                      ? guestRecentToStructured(item.address)
                      : item.address;
                  const summary = formatAddressSummary(structured);
                  const key =
                    item.kind === "saved"
                      ? item.address.id
                      : item.kind === "recent"
                        ? "recent"
                        : `guest-${item.address.line1}-${item.address.postalCode}`;
                  return (
                    <li key={key} role="option" aria-selected={index === activeIndex}>
                      <button
                        type="button"
                        id={`${listboxId}-option-${index}`}
                        className={cn(
                          "flex min-h-12 w-full flex-col items-start px-4 py-3.5 text-left transition-colors duration-150 touch-manipulation",
                          index === activeIndex ? "bg-accent-muted" : "hover:bg-surface-muted",
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          selectStructured(
                            structured,
                            item.kind === "guest-recent" ? "guest_recent" : item.kind,
                          )
                        }
                      >
                        <span className="text-[11px] font-semibold tracking-wide text-accent uppercase">
                          {sectionHint}
                        </span>
                        <span className="mt-0.5 text-sm font-medium text-ink">{itemLabel}</span>
                        <span className="mt-0.5 text-xs text-ink-muted">{summary}</span>
                      </button>
                    </li>
                  );
                })}
                {savedLoading && savedItems.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-ink-muted">Loading saved places…</li>
                ) : null}
              </>
            ) : null}

            {showPredictionSection ? (
              <>
                <li className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-subtle uppercase">
                  Suggested
                </li>
                {loadingPredictions && predictions.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-ink-muted">Searching…</li>
                ) : null}
                {noResults && !loadingPredictions ? (
                  <li className="px-4 py-3 text-sm text-ink-muted">
                    No matches. Try a different spelling.
                  </li>
                ) : null}
                {dropdownItems.map((item, index) => {
                  if (item.kind !== "prediction") return null;
                  const main = item.prediction.mainText || item.prediction.description;
                  const secondary = item.prediction.secondaryText;
                  return (
                    <li
                      key={item.prediction.placeId}
                      role="option"
                      aria-selected={index === activeIndex}
                    >
                      <button
                        type="button"
                        id={`${listboxId}-option-${index}`}
                        className={cn(
                          "flex min-h-12 w-full flex-col items-start px-4 py-3.5 text-left transition-colors duration-150 touch-manipulation",
                          index === activeIndex ? "bg-accent-muted" : "hover:bg-surface-muted",
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectPrediction(item.prediction)}
                      >
                        <span className="text-sm font-medium text-ink sm:text-[15px]">{main}</span>
                        {secondary ? (
                          <span className="mt-0.5 text-xs text-ink-muted sm:text-sm">{secondary}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </>
            ) : null}
          </ul>
        ) : null}
      </div>

      {!isHero ? (
        <>
          <div>
            <Label htmlFor="line2" className="text-ink-muted">
              Unit / Apt / Suite
            </Label>
            <Input
              id="line2"
              value={value.line2 ?? ""}
              onChange={(event) => updateField({ line2: event.target.value })}
              placeholder="Optional"
              className="booking-input-lg mt-2 rounded-xl"
            />
          </div>

          {structuredSelected && !manualExpanded ? (
            <div className="rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
              <p className="text-sm text-ink">{summaryText}</p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-accent underline-offset-2 hover:underline"
                onClick={() => setManualExpanded(true)}
              >
                Edit city, region, or postal code
              </button>
            </div>
          ) : (
            <>
              {(manualExpanded || !structuredSelected || status !== "ready") && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="city" required className="text-ink-muted">
                        City
                      </Label>
                      <Input
                        id="city"
                        value={value.city ?? ""}
                        onChange={(event) => updateField({ city: event.target.value })}
                        invalid={Boolean(errors?.city)}
                        className="booking-input-lg mt-2 rounded-xl"
                      />
                      {errors?.city ? <p className="mt-2 text-sm text-error">{errors.city}</p> : null}
                    </div>
                    <div>
                      <Label htmlFor="state" required className="text-ink-muted">
                        State / Province
                      </Label>
                      <Input
                        id="state"
                        value={value.state ?? ""}
                        onChange={(event) => updateField({ state: event.target.value })}
                        invalid={Boolean(errors?.state)}
                        className="booking-input-lg mt-2 rounded-xl"
                      />
                      {errors?.state ? (
                        <p className="mt-2 text-sm text-error">{errors.state}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="postalCode" required className="text-ink-muted">
                        Postal code
                      </Label>
                      <Input
                        id="postalCode"
                        value={value.postalCode ?? ""}
                        onChange={(event) => updateField({ postalCode: event.target.value })}
                        invalid={Boolean(errors?.postalCode)}
                        className="booking-input-lg mt-2 rounded-xl"
                      />
                      {errors?.postalCode ? (
                        <p className="mt-2 text-sm text-error">{errors.postalCode}</p>
                      ) : null}
                    </div>
                    <div>
                      <Label htmlFor="country" required className="text-ink-muted">
                        Country
                      </Label>
                      <Input
                        id="country"
                        value={value.country ?? "US"}
                        onChange={(event) =>
                          updateField({ country: event.target.value.toUpperCase() })
                        }
                        maxLength={2}
                        invalid={Boolean(errors?.country)}
                        className="booking-input-lg mt-2 rounded-xl"
                      />
                      {errors?.country ? (
                        <p className="mt-2 text-sm text-error">{errors.country}</p>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
              {structuredSelected && manualExpanded ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualExpanded(false)}
                >
                  Hide address details
                </Button>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
