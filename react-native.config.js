// Default to ON for device-first builds.
// Set RN_SPOTIFY_IOS=0 when you want simulator-safe prebuild/pods.
const enableSpotifyIos = process.env.RN_SPOTIFY_IOS !== '0';

/** @type {import('@react-native-community/cli-types').Config} */
module.exports = {
  dependencies: {
    ...(enableSpotifyIos
      ? {}
      : {
          // Spotify iOS SDK bundled by react-native-spotify-remote is device-only.
          // Disable iOS autolinking by default so simulator builds work reliably.
          'react-native-spotify-remote': {
            platforms: { ios: null },
          },
        }),
  },
};
