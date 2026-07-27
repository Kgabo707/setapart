require("react-native-gesture-handler/jestSetup");

// SafeAreaProvider measures its frame natively and renders nothing until it
// has one, so tests need the library's stubbed insets.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
