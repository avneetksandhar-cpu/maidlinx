/** Minimal Google Maps Places types for optional autocomplete integration. */
declare global {
  namespace google.maps.places {
    interface PlaceResult {
      address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
      formatted_address?: string;
      geometry?: {
        location?: {
          lat(): number;
          lng(): number;
        };
      };
      place_id?: string;
    }

    interface AutocompletePrediction {
      description: string;
      place_id: string;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLngBoundsLiteral {
      south: number;
      west: number;
      north: number;
      east: number;
    }

    interface AutocompletionRequest {
      input: string;
      types?: string[];
      componentRestrictions?: { country: string | string[] };
      location?: LatLngLiteral;
      radius?: number;
      bounds?: LatLngBoundsLiteral;
      sessionToken?: AutocompleteSessionToken;
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
      sessionToken?: AutocompleteSessionToken;
    }

    class AutocompleteSessionToken {}

    class AutocompleteService {
      getPlacePredictions(
        request: AutocompletionRequest,
        callback: (
          results: AutocompletePrediction[] | null,
          status: PlacesServiceStatus,
        ) => void,
      ): void;
    }

    class PlacesService {
      constructor(attrContainer: HTMLDivElement | google.maps.Map);
      getDetails(
        request: PlaceDetailsRequest,
        callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void,
      ): void;
    }

    enum PlacesServiceStatus {
      OK = "OK",
      ZERO_RESULTS = "ZERO_RESULTS",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      INVALID_REQUEST = "INVALID_REQUEST",
      NOT_FOUND = "NOT_FOUND",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
    }

    class Autocomplete {
      constructor(
        input: HTMLInputElement,
        opts?: {
          types?: string[];
          fields?: string[];
          componentRestrictions?: { country: string[] };
        },
      );
      addListener(event: string, handler: () => void): google.maps.MapsEventListener;
      getPlace(): PlaceResult;
    }
  }

  namespace google.maps {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Map {}

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    /** Reverse geocode status strings used by Geocoder. */
    type GeocoderStatus =
      | "OK"
      | "ZERO_RESULTS"
      | "OVER_QUERY_LIMIT"
      | "REQUEST_DENIED"
      | "INVALID_REQUEST"
      | "UNKNOWN_ERROR"
      | "ERROR";

    interface GeocoderRequest {
      location?: LatLngLiteral;
      address?: string;
      placeId?: string;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (
          results: google.maps.places.PlaceResult[] | null,
          status: GeocoderStatus,
        ) => void,
      ): void;
    }

    namespace event {
      function removeListener(listener: MapsEventListener): void;
    }

    interface MapsEventListener {
      remove(): void;
    }
  }

  namespace google {
    // populated by Maps JS API script
  }

  interface Window {
    google?: typeof google;
    /** Called by the Maps JS API when the key fails authentication. */
    gm_authFailure?: () => void;
  }
}

export {};
