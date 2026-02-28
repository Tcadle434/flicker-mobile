import { ConfigPlugin } from '@expo/config-plugins';
/**
 * Adds the DeviceActivityMonitor extension target to the Xcode project.
 * This extension runs in its own process and re-applies shields even if the app is killed.
 */
export declare const withDeviceActivityMonitor: ConfigPlugin;
