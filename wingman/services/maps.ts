/**
 * Maps service stub — wire to Google Maps, Mapbox, or another provider.
 */

export type LatLng = {
  lat: number;
  lng: number;
};

export async function geocodeAddress(_address: string): Promise<LatLng | null> {
  // TODO: integrate maps provider
  return null;
}
