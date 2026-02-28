"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDeviceActivityMonitor = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const Xcodeproj_1 = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const path = __importStar(require("path"));
const EXTENSION_NAME = 'DeviceActivityMonitorExtension';
const EXTENSION_BUNDLE_ID_SUFFIX = '.deviceactivitymonitor';
const DEFAULT_BUNDLE_ID = 'com.thomascadle.flicker';
/**
 * Adds the DeviceActivityMonitor extension target to the Xcode project.
 * This extension runs in its own process and re-applies shields even if the app is killed.
 */
const withDeviceActivityMonitor = (config) => {
    return (0, config_plugins_1.withXcodeProject)(config, async (mod) => {
        const xcodeProject = mod.modResults;
        const bundleId = config.ios?.bundleIdentifier ?? DEFAULT_BUNDLE_ID;
        const teamId = config.ios?.appleTeamId;
        const extensionBundleId = `${bundleId}${EXTENSION_BUNDLE_ID_SUFFIX}`;
        const extensionDir = path.join(mod.modRequest.projectRoot, 'modules/flicker-app-blocking/extensions', EXTENSION_NAME);
        const entitlementsPath = path.join(extensionDir, `${EXTENSION_NAME}.entitlements`);
        // Check if target already exists
        const existingTarget = xcodeProject.pbxTargetByName(EXTENSION_NAME);
        if (existingTarget) {
            return mod;
        }
        // Add the extension target
        const target = xcodeProject.addTarget(EXTENSION_NAME, 'app_extension', EXTENSION_NAME, extensionBundleId);
        // Add source files to the extension target
        const groupName = EXTENSION_NAME;
        const group = xcodeProject.addPbxGroup([
            'Info.plist',
            `${EXTENSION_NAME}.entitlements`,
        ], groupName, extensionDir);
        // Add group to main project group
        const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
        xcodeProject.addToPbxGroup(group.uuid, mainGroup);
        // Add sources build phase to extension target.
        xcodeProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
        const swiftFiles = ['DeviceActivityMonitorExtension.swift', 'AppGroupStorage.swift'];
        for (const file of swiftFiles) {
            (0, Xcodeproj_1.addBuildSourceFileToGroup)({
                filepath: path.join(extensionDir, file),
                groupName,
                project: xcodeProject,
                targetUuid: target.uuid,
            });
        }
        // Configure build settings
        const configurations = xcodeProject.pbxXCBuildConfigurationSection();
        for (const key in configurations) {
            const config = configurations[key];
            if (config.buildSettings && config.name) {
                const targetName = config.buildSettings.PRODUCT_NAME;
                if (targetName === `"${EXTENSION_NAME}"` || targetName === EXTENSION_NAME) {
                    config.buildSettings.SWIFT_VERSION = '5.9';
                    config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.0';
                    config.buildSettings.CODE_SIGN_STYLE = 'Automatic';
                    if (teamId)
                        config.buildSettings.DEVELOPMENT_TEAM = teamId;
                    config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${extensionBundleId}"`;
                    config.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${entitlementsPath}"`;
                    config.buildSettings.INFOPLIST_FILE = `"${extensionDir}/Info.plist"`;
                    config.buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
                }
            }
        }
        return mod;
    });
};
exports.withDeviceActivityMonitor = withDeviceActivityMonitor;
