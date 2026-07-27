# Expats — React Native client

Dating for people who left home to find it.

A native (iOS + Android) Expo client for the **Expats** dating app. The Firebase
project `primi-signals` already holds the Firestore data, Cloud Functions, and
seed profiles — this app is a client-only rebuild that talks to them.

## Requirements

- Node 18 or newer
- Expo CLI (used through `npx`, no global install needed)
- Xcode or Android Studio for simulators, or the Expo Go app on a device
- A [development build](#development-build) for voice notes, push tokens, and
  video calls

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm start
```

Press `i` for the iOS simulator or `a` for the Android emulator.

### Environment

Every value is read through `process.env.EXPO_PUBLIC_*`, so Metro must be
restarted after editing `.env`.

| Variable                                | Where it comes from                              |
| --------------------------------------- | ------------------------------------------------ |
| `EXPO_PUBLIC_FIREBASE_*`                | Firebase console → Project settings → Your apps  |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`        | Google Cloud console → Credentials → OAuth ids   |
| `EXPO_PUBLIC_PAYFAST_MERCHANT_ID`/`KEY` | PayFast dashboard                                 |
| `EXPO_PUBLIC_PAYFAST_SANDBOX`           | `true` while testing, `false` in production      |

Also set `expo.extra.eas.projectId` in `app.json` — push notification
registration is skipped until it is a real id.

Until Firebase is configured the Discover tab explains what is missing instead
of failing with a cryptic auth error.

## Architecture

```
src/
├── config/      firebase init, design tokens, cities/intents/plans/pricing
├── hooks/       auth, profiles, plan, swipes, conversations, messages,
│                discovery settings, vibe check, push, WebRTC
├── navigation/  root switch (auth → onboarding → tabs) and the tab bar
├── screens/     auth, Discover, Chat, Settings, Profile, Account
├── components/  shared buttons, chips, avatars, headers, empty states
└── utils/       matching, geolocation, trust score, deck building,
                 media upload, swipe limits, PayFast, formatting
```

`AppNavigator` picks one of three trees based on auth state: the auth stack when
signed out, onboarding when the user doc has no `onboardingComplete`, and the
tabs once onboarding is done.

### Backend contract

The app writes to the collections the Cloud Functions already watch, so most
"server" behaviour is a side effect of a client write:

| Client action                                      | Function that reacts       |
| -------------------------------------------------- | -------------------------- |
| `saveOnboardingData` sets `onboardingComplete`      | `onUserOnboarded` seeds five auto-likes |
| `recordSwipe` creates `/matches/{a}_{b}`            | `onMatchCreated` sends the bot's opener |
| `sendMessage` adds to `conversations/*/messages`    | `onMessageSent` writes the Claude reply |
| Account screen mounts                               | `getUserPlan` (callable)   |
| Typing in the chat input                            | `vibeScore` (callable, debounced 600ms) |
| First launch after onboarding                       | `savePushToken` (callable) |
| PayFast checkout completes                          | `payfastITN` updates the plan |

Claude is only ever reached through those functions. The Anthropic SDK is a
backend dependency and is never imported here.

### Things worth knowing

**Gender values.** Firestore stores `"man"` / `"woman"`; the discovery setting
uses `"men"` / `"women"`. The mapping lives in one place
(`utils/profiles.js`) and everything else calls through it.

**Trust scores** are computed on the client from `trustData` and shown to women
by default. A profile with fewer than five data points shows a dash rather than
a misleadingly precise number.

**Swipe limits** are counted per user per day in AsyncStorage. Free accounts get
30 swipes; Premium is unlimited.

**Bot matches** are seed profiles (`isSeed: true`). They reply through Claude,
but they can't take a video call — that screen says so after three seconds
rather than ringing forever.

## Development build

Expo Go can run most of the app, but three things need native modules that
aren't in it:

- `react-native-webrtc` for real video calls (the screen falls back to a local
  camera preview without it)
- push notification tokens
- reliable microphone recording on some devices

```bash
npx expo prebuild        # generates ios/ and android/
npx expo run:ios         # or: npx expo run:android
```

Or build in the cloud with `eas build --profile development`.

## Scripts

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `npm start`      | Metro dev server                              |
| `npm run ios`    | Dev server + iOS simulator                    |
| `npm run android`| Dev server + Android emulator                 |
| `npm test`       | Jest unit and component tests                 |
| `npm run lint`   | ESLint                                        |
| `npm run doctor` | `expo-doctor` dependency and config checks    |

## Tests

Jest covers the pure logic — trust scoring, distance maths, deck filtering
(including the gender mapping), mutual-match detection, swipe accounting, and
timestamp formatting — plus render tests for the shared components and the
trust ring, and boot tests that mount the real app with Firebase mocked and
check it lands on the right screen for each auth state.

```bash
npm test
```
