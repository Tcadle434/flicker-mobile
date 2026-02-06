import type { NativeLocationResult } from './nativeSensorsModule';
import { getCurrentLocation as getNativeLocation } from './nativeSensorsModule';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cachedLocation: { value: NativeLocationResult; timestamp: number } | null = null;

export async function getCurrentLocation(): Promise<NativeLocationResult> {
  if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_TTL_MS) {
    return cachedLocation.value;
  }

  const result = await getNativeLocation();
  if (result) {
    cachedLocation = { value: result, timestamp: Date.now() };
  }
  return result;
}
