import { Platform } from 'react-native';

/**
 * Configure your server API endpoint URL here.
 * 
 * LOCAL TESTING:
 * - If using Android Emulator: 'http://10.0.2.2:3000'
 * - If using iOS Simulator: 'http://localhost:3000'
 * - If testing on physical device (recommended): Use your computer's local network IP (e.g. 'http://192.168.1.XX:3000')
 * 
 * PRODUCTION:
 * - Use your live KVM website domain (e.g. 'https://gymdate.in')
 */

const LOCAL_IP = '192.168.1.100'; // FIXME: Replace with your actual local IP address from ipconfig

export const CONFIG = {
  API_URL: Platform.select({
    android: `http://${LOCAL_IP}:3000`,
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
  }),
  
  // Toggle this to true to force connect to your production website domain
  USE_PRODUCTION: true,
  PRODUCTION_API_URL: 'https://gym-date-fqml.vercel.app',
};

export const getApiUrl = () => {
  if (CONFIG.USE_PRODUCTION) {
    return CONFIG.PRODUCTION_API_URL;
  }
  return CONFIG.API_URL;
};
