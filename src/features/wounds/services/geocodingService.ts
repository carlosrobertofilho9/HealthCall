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

/**
 * Converts latitude and longitude into a readable address string.
 * Format: "Rua, Bairro, Cidade"
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    // Nominatim requires a User-Agent. Using a generic one for the app.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR',
          'User-Agent': 'HealthCall-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
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
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
