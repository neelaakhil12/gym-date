// Global in-memory cache for OTPs across all Next.js bundles and routes
const globalForOtp = globalThis as unknown as {
  otpCache?: Map<string, { otp: string; expires: number }>;
};

export const otpCache =
  globalForOtp.otpCache || new Map<string, { otp: string; expires: number }>();

globalForOtp.otpCache = otpCache;
