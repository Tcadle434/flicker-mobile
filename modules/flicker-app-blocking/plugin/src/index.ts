import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
import { withEntitlements } from './withEntitlements';
import { withDeviceActivityMonitor } from './withDeviceActivityMonitor';
import { withShieldConfigurationProvider } from './withShieldConfigurationProvider';

const PLUGIN_NAME = 'flicker-app-blocking';
const PLUGIN_VERSION = '0.0.1';

const withFlickerAppBlocking: ConfigPlugin = (config) => {
  config = withEntitlements(config);
  config = withDeviceActivityMonitor(config);
  config = withShieldConfigurationProvider(config);
  return config;
};

export default createRunOncePlugin(withFlickerAppBlocking, PLUGIN_NAME, PLUGIN_VERSION);
