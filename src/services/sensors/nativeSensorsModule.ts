import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type NativeLocationResult = {
  latitude: number;
  longitude: number;
  accuracy?: number;
} | null;

export type NativeHeartRateResult = {
  bpm: number;
  variability: number;
} | null;

let cachedModule: {
  getCurrentLocation: () => Promise<NativeLocationResult>;
  getLatestHeartRate: () => Promise<NativeHeartRateResult>;
} | null = null;

const getModule = () => {
  if (Platform.OS !== 'ios') return null;
  if (cachedModule) return cachedModule;

  try {
    cachedModule = requireNativeModule('FlickerSensors');
    return cachedModule;
  } catch (error) {
    return null;
  }
};

export async function getCurrentLocation(): Promise<NativeLocationResult> {
  const module = getModule();
  if (!module?.getCurrentLocation) return null;

  try {
    return await module.getCurrentLocation();
  } catch (error) {
    return null;
  }
}

export async function getLatestHeartRate(): Promise<NativeHeartRateResult> {
  const module = getModule();
  if (!module?.getLatestHeartRate) return null;

  try {
    return await module.getLatestHeartRate();
  } catch (error) {
    return null;
  }
}
