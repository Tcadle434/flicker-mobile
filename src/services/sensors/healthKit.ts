import type { AdaptiveInputs } from '../../types';
import { getLatestHeartRate as getNativeHeartRate } from './nativeSensorsModule';

export async function getLatestHeartRate(): Promise<AdaptiveInputs['heartRate']> {
  const result = await getNativeHeartRate();
  if (!result) return null;

  return {
    bpm: result.bpm,
    variability: result.variability ?? 0,
  };
}
