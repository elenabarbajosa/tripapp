# TripApp

Collaborative travel planning for solo travellers, couples, families, and groups.

**Plan the trip together. Keep everything in one place.**

This repository is an Expo + React Native + TypeScript + Supabase foundation intended for eventual App Store and Google Play release.

## Phase status

**Phase 2A complete:** Supabase client, profiles migration/RLS, email authentication, session persistence, and protected navigation.

**Still upcoming**

- **Phase 2B:** Google and Apple sign-in
- **Phase 3+:** Trips, invitations, itinerary, bookings, expenses, voting, maps

## Stack

| Layer | Choice |
| --- | --- |
| App | Expo SDK 57, React Native, TypeScript (strict) |
| Routing | Expo Router (`Stack.Protected`) |
| Styling | React Native `StyleSheet` + centralized theme tokens |
| Backend | Supabase Auth + PostgreSQL + RLS |
| Session storage | LargeSecureStore (SecureStore key + encrypted AsyncStorage) |
| Forms | React Hook Form + Zod |
| Images | Expo Image |
| Fonts | Literata (display/brand) + DM Sans (UI) |
| Quality | ESLint, Prettier, Jest (`jest-expo`) |

## Environment variables

Copy the template and fill in public Supabase values only:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_APP_ENV=development
```

- Find the **Project URL** and **publishable key** in the Supabase dashboard under **Project Settings → API** (or the Connect dialog).
- Never put a **service-role** key in the app or commit `.env`.
- Do not log environment-variable values.

Legacy name `EXPO_PUBLIC_SUPABASE_ANON_KEY` has been replaced by `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Supabase setup (Phase 2A)

### 1. Create a project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Create a new project.
3. Copy the Project URL and publishable key into `.env`.

### 2. Apply the profiles migration

Migration file:

`supabase/migrations/20260802000000_create_profiles.sql`

**Option A — SQL Editor**

1. Open **SQL Editor** in your Supabase project.
2. Paste the full contents of the migration file.
3. Run it.

**Option B — Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 3. Configure email authentication

1. Open **Authentication → Providers → Email**.
2. Ensure Email provider is enabled.
3. For local development, you may disable **Confirm email** so sign-up returns a session immediately.
4. If email confirmation stays enabled, confirm via the email link before signing in. Native deep-link confirmation handling arrives later.

### 4. Database types

Hand-maintained types live in `src/types/database.ts` and match the Phase 2A migration.

Later, regenerate from Supabase and replace that file:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

## Styling rules

- No static inline styles in screens or components.
- No `StyleSheet.create()` inside screen/component implementation files.
- Every UI surface imports styles from a colocated `*.styles.ts` file.
- Colours, spacing, radii, typography, shadows, and sizes come from `src/theme/`.
- Branding lives in `src/constants/branding.ts`.
- Hex colour values appear only in `src/theme/colors.ts`.

## Project structure

```text
app/                       # Thin Expo Router routes + protected navigation
src/
  theme/                   # Design tokens + ThemeProvider
  constants/               # Branding + env validation
  features/auth/           # AuthProvider + helpers
  features/preview/        # Development-only mock preview
  components/              # Reusable UI
  screens/                 # Screen implementations + styles
  data/mock/               # Phase 1 mock trip data (preview only)
  services/supabase/       # Shared client, storage, profiles
  validation/              # Zod schemas
  types/database.ts        # Typed Supabase schema
supabase/migrations/       # SQL migrations
```

## Getting started

### Prerequisites

- Node.js LTS
- npm
- Xcode (for iOS Simulator)
- Android Studio (optional)

### Install and run

```bash
cp .env.example .env
# add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm install
npm run start
npm run ios
npm run android
```

### Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npx expo-doctor
```

## App flows to try

1. Launch app → Welcome.
2. **Continue with email** → create account / sign in.
3. Confirm session persistence by force-quitting and reopening.
4. Open Profile → Sign out.
5. In development only, tap **Preview app** to browse mock trip UI without a Supabase session.
6. Google / Apple buttons show a “next authentication step” message (Phase 2B).

## Development preview

When `EXPO_PUBLIC_APP_ENV=development`, Welcome shows **Preview app**.

- Preview does **not** create a fake Supabase user.
- Preview is separate from `isAuthenticated`.
- Preview uses `src/data/mock` only.
- Production builds hide the preview button.
- RLS still protects all database data.

## Expo / native notes

| Package | Notes |
| --- | --- |
| `expo-secure-store` | Stores AES key for session encryption |
| `@react-native-async-storage/async-storage` | Stores encrypted session payload |
| `aes-js` + `react-native-get-random-values` | LargeSecureStore encryption |
| Apple / Google auth | Phase 2B |
| Maps | Phase 8; may require a development build |

### Identifiers

- iOS bundle identifier: `com.tripapp.app`
- Android package: `com.tripapp.app`
- URL scheme: `tripapp`

## Security warnings

- Never commit `.env`.
- Never ship or commit a Supabase **service-role** key.
- Navigation guards are UX only; RLS enforces data access.

## License

Private project — see `LICENSE` if present.
