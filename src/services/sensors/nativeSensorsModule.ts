import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type NativeLocationResult = {
  latitude: number;
  longitude: number;
  accuracy?: number;
} | null;

let cachedModule: {
  getCurrentLocation: () => Promise<NativeLocationResult>;
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
