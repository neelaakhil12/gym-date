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
  API_URL: 'https://gymdate.in',
  USE_PRODUCTION: true,
  PRODUCTION_API_URL: 'https://gymdate.in',
};

export const getApiUrl = () => {
  return CONFIG.PRODUCTION_API_URL;
};
