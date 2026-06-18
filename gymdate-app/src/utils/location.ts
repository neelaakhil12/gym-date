/**
 * Cross-platform location helper.
 * - Native (Android/iOS): uses expo-location with proper permission request
 * - Web: uses navigator.geolocation
 */
import { Platform } from 'react-native';

export interface Coords {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<Coords> {
  if (Platform.OS === 'web') {
    // Web — use standard browser geolocation
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation not supported in this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          if (err.code === 1) reject(new Error('Location permission denied. Please allow access in browser settings.'));
          else if (err.code === 3) reject(new Error('Location request timed out. Please try again.'));
          else reject(new Error('Could not get your location. Please try again.'));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  } else {
    // Native Android / iOS — use expo-location
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied. Please allow access in your device settings.');
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  }
}

/**
 * Reverse geocode coordinates → readable address + city using Google Maps API
 */
const GOOGLE_MAPS_API_KEY = 'AIzaSyA_y5PoTdP0o2MZRDGkTVtFgguLTSaGIEE';

export async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; address: string }> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const address = data.results[0].formatted_address;
      const components: any[] = data.results[0].address_components || [];
      const cityComp = components.find((c: any) =>
        c.types.includes('locality') ||
        c.types.includes('sublocality_level_1') ||
        c.types.includes('administrative_area_level_2')
      );
      const stateComp = components.find((c: any) =>
        c.types.includes('administrative_area_level_1')
      );
      const city = cityComp?.long_name || stateComp?.long_name || '';
      return { city, address };
    }
  } catch (_) {}
  return {
    city: 'Current Location',
    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  };
}
