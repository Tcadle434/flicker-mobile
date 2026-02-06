import type { AdaptiveInputs } from '../../types';
import { getLatestHeartRate } from '../sensors/healthKit';

export async function getHeartRateInput(): Promise<AdaptiveInputs['heartRate']> {
  return getLatestHeartRate();
}
