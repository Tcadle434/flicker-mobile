"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withEntitlements_1 = require("./withEntitlements");
const withDeviceActivityMonitor_1 = require("./withDeviceActivityMonitor");
const withShieldConfigurationProvider_1 = require("./withShieldConfigurationProvider");
const PLUGIN_NAME = 'flicker-app-blocking';
const PLUGIN_VERSION = '0.0.1';
const withFlickerAppBlocking = (config) => {
    config = (0, withEntitlements_1.withEntitlements)(config);
    config = (0, withDeviceActivityMonitor_1.withDeviceActivityMonitor)(config);
    config = (0, withShieldConfigurationProvider_1.withShieldConfigurationProvider)(config);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFlickerAppBlocking, PLUGIN_NAME, PLUGIN_VERSION);
