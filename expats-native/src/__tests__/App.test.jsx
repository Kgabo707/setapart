import { render, screen, waitFor } from "@testing-library/react-native";

import App from "../../App";

// Firebase is replaced wholesale: these tests exercise the provider,
// navigation and screen wiring rather than the network.
let mockAuthUser = null;
let mockUserDoc = null;

jest.mock("../config/firebase", () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
  functions: {},
  isFirebaseConfigured: true,
  firebaseConfig: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth, cb) => {
    cb(mockAuthUser);
    return () => {};
  },
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  signInWithCredential: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  OAuthProvider: class {
    credential() {
      return {};
    }
  },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(async () => ({ exists: () => false })),
  getDocs: jest.fn(async () => ({ docs: [], empty: true })),
  limit: jest.fn(),
  onSnapshot: (_ref, onNext) => {
    // Satisfies both the single-doc and the collection listener shapes.
    onNext({ exists: () => Boolean(mockUserDoc), data: () => mockUserDoc, docs: [] });
    return () => {};
  },
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(async () => {}),
  where: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("firebase/functions", () => ({ httpsCallable: () => jest.fn(async () => ({ data: {} })) }));
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock("@expo-google-fonts/inter", () => ({
  useFonts: () => [true, null],
  Inter_400Regular: "Inter_400Regular",
  Inter_500Medium: "Inter_500Medium",
  Inter_700Bold: "Inter_700Bold",
}));

jest.mock("@expo-google-fonts/space-grotesk", () => ({
  SpaceGrotesk_700Bold: "SpaceGrotesk_700Bold",
}));

beforeEach(() => {
  mockAuthUser = null;
  mockUserDoc = null;
});

describe("signed out", () => {
  it("boots to the welcome screen", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("Expats")).toBeTruthy());
    expect(screen.getByText("Dating for people who left home to find it.")).toBeTruthy();
    expect(screen.getByText("Continue with Google")).toBeTruthy();
    expect(screen.getByText("Continue with email")).toBeTruthy();
  });
});

describe("signed in but not onboarded", () => {
  it("opens onboarding at the name step", async () => {
    mockAuthUser = { uid: "u1", email: "amira@example.com", providerData: [] };
    mockUserDoc = { onboardingComplete: false, plan: "free" };

    render(<App />);
    await waitFor(() => expect(screen.getByText("What should we call you?")).toBeTruthy());
    expect(screen.getByText("1/6")).toBeTruthy();
  });
});

describe("onboarded", () => {
  it("lands on the Discover tab with the whole tab bar mounted", async () => {
    mockAuthUser = { uid: "u1", email: "amira@example.com", providerData: [] };
    mockUserDoc = {
      onboardingComplete: true,
      plan: "free",
      gender: "woman",
      city: "doha",
      displayName: "Amira",
    };

    render(<App />);

    await waitFor(() => expect(screen.getByText("That's everyone for now")).toBeTruthy());
    ["Discover", "Chats", "Profile", "Account", "Settings"].forEach((tab) => {
      expect(screen.getByText(tab)).toBeTruthy();
    });
  });

  it("shows the remaining free swipes for a free account", async () => {
    mockAuthUser = { uid: "u1", email: "amira@example.com", providerData: [] };
    mockUserDoc = { onboardingComplete: true, plan: "free", gender: "woman" };

    render(<App />);
    await waitFor(() => expect(screen.getByText("30 left today")).toBeTruthy());
  });
});
