/**
 * Service for reverse geocoding using OpenStreetMap Nominatim.
 */

interface NominatimResponse {
  address?: {
    road?: string;
    pedestrian?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
  display_name?: string;
  error?: string;
}

const NOMINATIM_TIMEOUT_MS = 2500;

/**
 * Converts latitude and longitude into a readable address string.
 * Format: "Rua, Bairro, Cidade"
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const timerApi = (typeof globalThis !== 'undefined' ? globalThis : window) as Pick<
    typeof globalThis,
    'setTimeout' | 'clearTimeout'
  >;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? timerApi.setTimeout(() => {
        controller.abort();
      }, NOMINATIM_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR',
        },
        signal: controller?.signal,
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: NominatimResponse = await response.json();

    if (data.error) {
      return null;
    }

    const addr = data.address;
    if (!addr) return data.display_name || null;

    // Extract preferred components
    const road = addr.road || addr.pedestrian || '';
    const neighborhood = addr.suburb || addr.neighbourhood || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';

    const parts = [road, neighborhood, city].filter(Boolean);
    
    if (parts.length === 0) {
      return data.display_name || null;
    }

    return parts.join(', ');
  } catch {
    return null;
  } finally {
    if (timeoutId !== null) {
      timerApi.clearTimeout(timeoutId);
    }
  }
}
