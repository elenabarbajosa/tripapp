# TripApp

Collaborative travel planning for solo travellers, couples, families, and groups.

**Plan the trip together. Keep everything in one place.**

This repository is an Expo + React Native + TypeScript + Supabase foundation intended for eventual App Store and Google Play release.

## Phase status

**Phase 1 complete:** foundation, design system, navigation shells, and polished static screens with mock data.

Phases 2–8 (auth, database, live trip data, bookings, expenses, voting, maps) are intentionally not implemented yet.

## Stack

| Layer | Choice |
| --- | --- |
| App | Expo SDK 57, React Native, TypeScript (strict) |
| Routing | Expo Router |
| Styling | React Native `StyleSheet` + centralized theme tokens |
| Server | Supabase (client skeleton only in Phase 1) |
| Secure storage | Expo SecureStore (wired for future auth sessions) |
| Images | Expo Image |
| Fonts | Literata (display/brand) + DM Sans (UI) |
| Quality | ESLint, Prettier, Jest (`jest-expo`) |

## Styling rules

- No static inline styles in screens or components.
- No `StyleSheet.create()` inside screen/component implementation files.
- Every UI surface imports styles from a colocated `*.styles.ts` file.
- Colours, spacing, radii, typography, shadows, and sizes come from `src/theme/`.
- Branding (product name, tagline, logo mark) lives in `src/constants/branding.ts`.
- Hex colour values appear only in `src/theme/colors.ts`.

## Project structure

```text
app/                  # Thin Expo Router routes
src/
  theme/              # Design tokens + ThemeProvider
  constants/          # Branding + env config
  components/         # Reusable UI (implementation + styles)
  screens/            # Screen implementations + styles
  data/mock/          # Phase 1 mock trip data
  services/supabase/  # Client skeleton
  providers/
  types/
  utils/
```

## Getting started

### Prerequisites

- Node.js LTS
- npm
- Xcode (for iOS Simulator)
- Android Studio (optional, for Android)

### Install

```bash
cp .env.example .env
npm install
```

Phase 1 runs without Supabase credentials. Leave the `.env` values empty for now.

### Run

```bash
npm run start
npm run ios
npm run android
```

From the welcome screen, tap **Preview app (Phase 1)** to explore Home → trip Overview / Itinerary with Midwest Road Trip mock data.

### Quality checks

```bash
npm run lint
npm run typecheck
npm run test
```

## Expo / native notes

| Package | Phase 1 status |
| --- | --- |
| `expo-router` | Required; configured in `app.json` |
| `expo-secure-store` | Configured; used by Supabase auth storage adapter |
| `expo-image` | Used for trip covers and avatars |
| `expo-font` | Loads DM Sans + Literata |
| Apple / Google auth | Not wired yet (Phase 2). UI shows a clear message if tapped. |
| Maps | Placeholder only (Phase 8). Will likely need a development build. |

### Identifiers

Configured in `app.json`:

- iOS bundle identifier: `com.tripapp.app`
- Android package: `com.tripapp.app`
- URL scheme: `tripapp`

Update these before App Store / Play submission.

### Expo Go note

This project scaffolds on **Expo SDK 57**. If your physical device Expo Go build does not yet support SDK 57, use the iOS/Android simulators or an EAS development build.

## Manual setup required later (not Phase 1)

1. Create a Supabase project and copy URL + anon key into `.env`.
2. Configure Google OAuth and Apple Sign In (Phase 2).
3. Create an EAS project and replace `extra.eas.projectId` in `app.json`.
4. Obtain Geoapify and flight API keys; store private keys as Edge Function secrets (never `EXPO_PUBLIC_`).
5. Replace temporary branding in `src/constants/branding.ts` and app icons in `assets/`.

## Mock data

`src/data/mock` includes a multi-city Midwest trip:

Chicago → Milwaukee → Minneapolis → Mankato → Indianapolis

with members, itinerary days, a booking, budget, packing progress, and an open vote.

## License

Private project — see `LICENSE` if present.
