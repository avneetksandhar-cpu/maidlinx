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

    /** Places API (New) — FormattedText */
    interface FormattedText {
      text?: string;
    }

    /** Places API (New) — address component */
    interface AddressComponent {
      longText?: string;
      shortText?: string;
      types: string[];
    }

    /** Places API (New) — PlacePrediction */
    interface PlacePrediction {
      placeId?: string;
      text?: FormattedText;
      mainText?: FormattedText;
      secondaryText?: FormattedText;
      toPlace(): Place;
    }

    /** Places API (New) — one suggestion row */
    interface AutocompleteSuggestionResult {
      placePrediction?: PlacePrediction;
    }

    interface AutocompleteRequest {
      input: string;
      includedRegionCodes?: string[];
      includedPrimaryTypes?: string[];
      sessionToken?: AutocompleteSessionToken;
      locationBias?:
        | LatLngLiteral
        | LatLngBoundsLiteral
        | { center: LatLngLiteral; radius: number };
      language?: string;
      region?: string;
    }

    interface SearchNearbyRequest {
      fields: string[];
      locationRestriction: { center: LatLngLiteral; radius: number };
      rankPreference?: "DISTANCE" | "POPULARITY" | string;
      maxResultCount?: number;
      includedTypes?: string[];
    }

    class AutocompleteSessionToken {}

    class AutocompleteSuggestion {
      static fetchAutocompleteSuggestions(
        autocompleteRequest: AutocompleteRequest,
      ): Promise<{ suggestions: AutocompleteSuggestionResult[] }>;
    }

    /** Places API (New) — Place */
    class Place {
      static searchNearby(
        request: SearchNearbyRequest,
      ): Promise<{ places: Place[] }>;

      id?: string;
      formattedAddress?: string;
      displayName?: string;
      addressComponents?: AddressComponent[];
      location?: {
        lat(): number;
        lng(): number;
      };
      types?: string[];

      fetchFields(options: { fields: string[] }): Promise<{ place: Place }>;
    }

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
    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      disableDefaultUI?: boolean;
      gestureHandling?: string;
      clickableIcons?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
      styles?: Array<Record<string, unknown>>;
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      setCenter(latLng: LatLngLiteral): void;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
      panTo(latLng: LatLngLiteral): void;
    }

    interface Padding {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }

    class LatLngBounds {
      extend(point: LatLngLiteral): void;
      isEmpty(): boolean;
    }

    interface MarkerOptions {
      map?: Map | null;
      position?: LatLngLiteral;
      title?: string;
      label?: string | { text: string; color?: string; fontWeight?: string };
      icon?:
        | string
        | {
            path?: unknown;
            scale?: number;
            fillColor?: string;
            fillOpacity?: number;
            strokeWeight?: number;
            strokeColor?: string;
          };
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setPosition(latLng: LatLngLiteral): void;
      setMap(map: Map | null): void;
    }

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

    function importLibrary(name: string): Promise<Record<string, unknown>>;

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
