const expoPreset = require('jest-expo/jest-preset');

/**
 * The Firebase SDK ships ESM `.mjs` files that the Expo preset's transform pattern
 * (`\.[jt]sx?$`) does not match, so they need an explicit entry alongside an allowance
 * in `transformIgnorePatterns`.
 */
module.exports = {
  ...expoPreset,
  setupFiles: [...(expoPreset.setupFiles ?? []), '<rootDir>/jest.setup.js'],
  transform: {
    ...expoPreset.transform,
    '\\.mjs$': expoPreset.transform['\\.[jt]sx?$'],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|react-native-paper|firebase|@firebase))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
