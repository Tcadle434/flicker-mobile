import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

const DEFAULT_BUNDLE_ID = 'com.thomascadle.flicker';

const getAppGroup = (bundleId: string) => `group.${bundleId}`;

/**
 * Adds FamilyControls entitlement and App Group to the main app target.
 */
export const withEntitlements: ConfigPlugin = (config) => {
  const bundleId = config.ios?.bundleIdentifier ?? DEFAULT_BUNDLE_ID;
  const appGroup = getAppGroup(bundleId);

  return withEntitlementsPlist(config, (mod) => {
    // Family Controls entitlement
    mod.modResults['com.apple.developer.family-controls'] = true;

    // App Group for sharing data with extensions
    const existingGroups = (mod.modResults['com.apple.security.application-groups'] as string[]) || [];
    if (!existingGroups.includes(appGroup)) {
      mod.modResults['com.apple.security.application-groups'] = [...existingGroups, appGroup];
    }

    return mod;
  });
};
