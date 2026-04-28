// Shared in-memory cache for OTPs
export const otpCache = new Map<string, { otp: string, expires: number }>();
