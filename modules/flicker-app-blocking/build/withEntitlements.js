"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withEntitlements = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const DEFAULT_BUNDLE_ID = 'com.thomascadle.flicker';
const getAppGroup = (bundleId) => `group.${bundleId}`;
/**
 * Adds FamilyControls entitlement and App Group to the main app target.
 */
const withEntitlements = (config) => {
    const bundleId = config.ios?.bundleIdentifier ?? DEFAULT_BUNDLE_ID;
    const appGroup = getAppGroup(bundleId);
    return (0, config_plugins_1.withEntitlementsPlist)(config, (mod) => {
        // Family Controls entitlement
        mod.modResults['com.apple.developer.family-controls'] = true;
        // App Group for sharing data with extensions
        const existingGroups = mod.modResults['com.apple.security.application-groups'] || [];
        if (!existingGroups.includes(appGroup)) {
            mod.modResults['com.apple.security.application-groups'] = [...existingGroups, appGroup];
        }
        return mod;
    });
};
exports.withEntitlements = withEntitlements;
