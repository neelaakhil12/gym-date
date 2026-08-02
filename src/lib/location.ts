/**
 * Location Utilities for GymDate
 * Reverse geocoding and search with guaranteed English responses.
 */

export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Clean location strings (e.g., stripping OSM ward prefixes)
 */
function cleanLocationName(str: string): string {
  if (!str) return '';
  return str.replace(/^Ward\s+\d+\s*/i, '').trim();
}

/**
 * Format address components into a clean, exact, readable string
 */
function buildFormattedAddress(addr: Record<string, string>, displayName?: string): string {
  if (!addr) {
    if (displayName) {
      return displayName.replace(/,\s*India$/i, '').trim();
    }
    return 'Current Location';
  }

  const street = [cleanLocationName(addr.house_number), cleanLocationName(addr.road || addr.street || addr.building)].filter(Boolean).join(' ');
  const neighbourhood = cleanLocationName(addr.neighbourhood || addr.residential);
  const suburb = cleanLocationName(addr.suburb || addr.subdistrict);
  const city = cleanLocationName(addr.city || addr.town || addr.village || addr.city_district || addr.county);
  const state = cleanLocationName(addr.state);
  const pin = cleanLocationName(addr.postcode);

  const parts: string[] = [];
  if (street) parts.push(street);
  if (neighbourhood && neighbourhood.toLowerCase() !== street.toLowerCase()) parts.push(neighbourhood);
  if (suburb && suburb.toLowerCase() !== neighbourhood.toLowerCase() && suburb.toLowerCase() !== street.toLowerCase()) parts.push(suburb);
  if (city && city.toLowerCase() !== suburb.toLowerCase() && city.toLowerCase() !== neighbourhood.toLowerCase()) parts.push(city);
  if (state && state.toLowerCase() !== city.toLowerCase()) parts.push(state);
  if (pin) parts.push(pin);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (displayName) {
    return displayName.replace(/,\s*India$/i, '').trim();
  }

  return 'Current Location';
}

/**
 * Reverse geocode latitude and longitude to an exact clean English address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  // 1. Try Google Maps Geocoding API if key is present
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=en&key=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (geoData.status === "OK" && geoData.results && geoData.results.length > 0) {
        return geoData.results[0].formatted_address.replace(/,\s*India$/i, '').trim();
      }
    }
  } catch (err) {
    console.error("Google Maps reverse geocoding failed:", err);
  }

  // 2. OpenStreetMap Nominatim API with explicit English headers and parameters
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'GymDateApp/1.0'
        }
      }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      return buildFormattedAddress(geoData.address || {}, geoData.display_name);
    }
  } catch (err) {
    console.error("Nominatim reverse geocoding failed:", err);
  }

  return "Current Location";
}

/**
 * Search locations by query string (city, area, landmark) in India
 */
export async function searchLocation(query: string): Promise<LocationResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // 1. Try Google Geocoding API if key is available
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&language=en&components=country:IN&key=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (geoData.status === "OK" && geoData.results) {
        return geoData.results.slice(0, 5).map((item: any) => ({
          address: item.formatted_address,
          lat: item.geometry.location.lat,
          lng: item.geometry.location.lng
        }));
      }
    }
  } catch (err) {
    console.error("Google Maps location search failed:", err);
  }

  // 2. OpenStreetMap Nominatim search API
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(cleanQuery)}&accept-language=en&countrycodes=in&limit=5`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'GymDateApp/1.0'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        address: buildFormattedAddress(item.address || {}, item.display_name),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    }
  } catch (err) {
    console.error("Nominatim location search failed:", err);
  }

  return [];
}
