# SetApart

**Watch what builds you up.**

A video streaming app for Christian content — sermons, worship, teaching, youth,
testimonies, films and devotionals — published by verified churches, ministries and
studios. Built with Expo, React Native Paper (Material Design 3), Firebase and Mux.

This repository currently contains the structural backbone: theme, navigation shell,
role-based account model, Home and the video player. Search, My Library and the full
organization dashboard are follow-ups.

## Getting started

```bash
npm install
npm start
```

No configuration is needed to try it — without Firebase credentials the app boots
against a bundled demo dataset (see [Demo mode](#demo-mode)). Sign in with any email and
any six-character password.

### Which way to run it

Playback uses `react-native-video`, a native module that Expo Go does not bundle. That
is the only thing the three options differ on:

| | Command | Setup | Video plays? |
| --- | --- | --- | --- |
| **Expo Go** | `npm start`, scan the QR code | Expo Go from the App Store / Play Store | No — the player screen renders with a notice where the video would be |
| **Browser** | `npm run web` | None | Yes |
| **Development build** | `npx expo prebuild` then `npm run android` / `npm run ios` | Android Studio, or Xcode for iOS | Yes |

Expo Go is the fastest way to check the theme, navigation and role behaviour on a real
device. The browser is the quickest full-feature check and needs nothing installed. A
development build is what you want for real device playback — if you would rather not
install Android Studio or Xcode, `npx eas build --profile development --platform android`
builds one in the cloud instead.

`src/components/video/nativeVideo.ts` detects the runtime and swaps in the notice, so
Expo Go degrades to a poster frame rather than an "Unimplemented component" box.

### Demo mode

With no Firebase credentials in `.env`, the app boots against a bundled demo dataset
(five organizations, ~20 videos including some deliberately left in the moderation
queue) streaming from Mux's public demo assets. Any email plus a six-character password
signs you in, and mutations persist to `AsyncStorage`. This exists so the UI is
reviewable before a Firebase project is wired up; every service module falls back to it
behind `isFirebaseConfigured`.

To point at a real project, `cp .env.example .env` and fill in the six values from
Firebase console → Project settings → Your apps.

### Trying the role transition

The organization role is granted by a super-admin, so there is no in-app way to reach
the dashboard. To walk the whole flow yourself:

1. Sign in, go to **Profile → Register your organization** and submit the form. Profile
   now shows "Application under review", and the dashboard entry stays hidden.
2. Approve it the way an admin would. In demo mode the store lives in `AsyncStorage`
   under `setapart.demo.state.v1` — on web you can edit it from the browser console:

   ```js
   const key = 'setapart.demo.state.v1';
   const state = JSON.parse(localStorage.getItem(key));
   const org = state.organizations.at(-1);
   org.verificationStatus = 'verified';
   Object.assign(state.users[state.signedInUserId], {
     roles: ['viewer', 'organization'],
     orgId: org.id,
   });
   localStorage.setItem(key, JSON.stringify(state));
   location.reload();
   ```

   Against a real project, make the same three edits in the Firestore console.
3. Profile now shows the **Organization Dashboard** entry, with the viewer tabs still
   underneath.

## Design system

Material Design 3 via `react-native-paper`, with a navy-and-white brand where red is an
accent only — roughly 80% of any screen is navy or white.

| Token | Value | Used for |
| --- | --- | --- |
| Primary | `#0A1F44` navy | App bars, bottom navigation, primary buttons |
| Accent | `#B22222` crimson | CTAs, live/featured badges, active tab, FAB |
| Background | `#F8F8F6` off-white | Screen backgrounds |
| Surface | `#FFFFFF` | Cards |
| Text | `#141A28` near-black (navy cast) | Body copy on light surfaces |

Cards use a 12–16px radius with soft navy-tinted shadows. Type is system sans-serif with
line heights taller than the MD3 defaults, since sermon and devotional descriptions are
long-form. Everything lives in `src/theme/`; `useAppTheme()` returns the Paper theme
plus a `brand` object for tokens MD3 has no slot for (the navy app bar, gradient scrims,
verification colours).

## Account and role model

A single account can hold both roles. `roles` is additive, never a switch:

1. Every signup creates `roles: ["viewer"]`.
2. A viewer submits an application from **Profile → Register your organization**. This
   writes an `organizations` document with `verificationStatus: "pending"` and
   **deliberately does not touch `roles` or `orgId`**.
3. A super-admin approves it (out of scope for this build — assume the Firestore
   console): flip `verificationStatus` to `verified`, push `"organization"` onto the
   user's `roles`, and set `orgId`.
4. The **Organization Dashboard** entry then appears in Profile. It is the only place
   the app changes context.

An organization owner still gets the normal viewer bottom tabs as their default view.
The dashboard is a stack pushed on top, so backing out returns them exactly where they
were.

## Navigation

```
RootNavigator
├── (signed out) AuthNavigator — SignIn, SignUp
└── (signed in) RootStack
    ├── MainTabs (bottom navigation)     ← default view for every account
    │   ├── Home
    │   ├── Search
    │   ├── Library
    │   └── Profile
    ├── VideoPlayer
    ├── CategoryFeed
    ├── OrganizationProfile
    ├── RegisterOrganization
    └── OrganizationArea (stack)          ← only reachable from Profile, role-gated
        ├── Dashboard
        ├── ManageVideos
        ├── UploadVideo
        └── OrganizationSettings
```

## Data model (Firestore)

**`users/{uid}`**

| Field | Type | Notes |
| --- | --- | --- |
| `displayName` | string | |
| `email` | string | |
| `roles` | `("viewer" \| "organization")[]` | Starts as `["viewer"]` |
| `orgId` | string? | Present only once verified |
| `favoriteVideoIds` | string[] | Backs the player's **Like** action |
| `watchLaterVideoIds` | string[] | Backs the player's **Save** action |
| `followedOrgIds` | string[] | |
| `watchHistory` | `{ videoId, watchedAt, positionSeconds }[]` | Newest first, capped at 50 |

`watchLaterVideoIds` is additive to the original spec: the player's action row needs
Like and Save to be genuinely distinct rather than two controls writing one list.

**`organizations/{id}`** — `name`, `description`, `logoUrl`, `verificationStatus`
(`pending` / `verified` / `rejected`), `contactEmail`, `ownerUserId`, `websiteUrl`,
`location`, `followerCount`, `createdAt`.

**`videos/{id}`** — `orgId`, `title`, `description`, `category`, `tags[]`,
`videoAssetId`, `thumbnailUrl`, `duration`, `publishStatus` (`pending` / `published` /
`rejected`), `viewCount`, `createdAt`, `isFeatured`, `isLive`, `speaker`.

### Publish-status enforcement

Every viewer-facing read goes through `src/services/api/videos.ts`, and every query
there — including single-document fetches and ID batches — constrains
`publishStatus == "published"`. `getPublishedVideo` re-checks after the read and returns
`null` for anything else, so a deep link to a pending video shows "unavailable" rather
than leaking it. The demo dataset intentionally contains one `pending` and one
`rejected` video to keep that guarantee exercised.

Firestore composite indexes are required for the category, featured and organization
queries (`publishStatus` + the filtered field + `createdAt`).

## Mux

`Video.videoAssetId` holds the public **playback ID**. `src/services/mux.ts` derives the
HLS manifest (`https://stream.mux.com/{id}.m3u8`) and thumbnail URLs from it. The upload
pipeline that mints those IDs is out of scope; assets are assumed to already exist in
Firestore.

## Project layout

```
src/
├── components/    Shared UI — cards, rails, badges, player surface
├── context/       AuthContext: session, profile, roles, optimistic mutations
├── hooks/         useAsyncData, useWatchProgress
├── navigation/    Navigators and typed param lists
├── screens/       One directory per area
├── services/
│   ├── api/       videos, organizations, users, auth
│   ├── demo/      Bundled dataset + AsyncStorage-backed store
│   ├── firebase.ts
│   └── mux.ts
├── theme/         Palette, typography, layout tokens, Paper theme
├── types/         Domain models
└── utils/         Formatting helpers
```

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

The test suite covers the two things that are easy to break silently: the
publish-status filter on every viewer-facing query, and the rule that applying for an
organization must not grant the `organization` role.
