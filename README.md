# TripApp

Collaborative travel planning for solo travellers, couples, families, and groups.

**Plan the trip together. Keep everything in one place.**

## Phase status

**Phase 2B complete:** Google authentication (native ID token) and Apple authentication architecture/UI.

**Still upcoming**

- **Phase 3+:** Trips, invitations, itinerary, bookings, expenses, voting, maps

## Stack

| Layer | Choice |
| --- | --- |
| App | Expo SDK 57, React Native, TypeScript (strict) |
| Routing | Expo Router (`Stack.Protected`) |
| Auth | Supabase Auth — email, Google ID token, Apple ID token |
| Session storage | LargeSecureStore (SecureStore key + encrypted AsyncStorage) |
| Forms | React Hook Form + Zod |

## Environment variables

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_APP_ENV=development

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

Never commit `.env` or service-role keys. Never put Google/Apple client **secrets** in the app.

| Variable | Required for |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | All auth |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All auth |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google native ID token (required) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google on iOS + Expo config plugin URL scheme |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Documentation / Google Cloud Android client (matched by package + SHA-1) |

## Authentication architecture

### Email

Unchanged from Phase 2A. Always available as a fallback.

### Google (native ID token)

1. `@react-native-google-signin/google-signin` obtains a Google ID token.
2. The app calls Supabase `signInWithIdToken({ provider: 'google', token })`.
3. The existing `auth.users` → `profiles` trigger creates the profile on first login.
4. Empty profile name/avatar fields may be filled from provider metadata; customized values are never overwritten.

**Expo Go:** Google native sign-in does **not** work in Expo Go (native module). Use a **development build**.

**Nonce:** The free Original Google Sign-In module does not expose a custom nonce API. Enable **Skip nonce check** for the Google provider in Supabase when using this native flow (documented by Supabase for Expo).

### Apple (native ID token)

1. `expo-apple-authentication` presents the official Apple button (iOS only).
2. A SHA-256 nonce is generated with `expo-crypto`.
3. The app calls Supabase `signInWithIdToken({ provider: 'apple', token, nonce })`.
4. Apple’s full name is captured on **first authorization only** and stored without overwriting a customized profile name later.

**Expo Go:** Apple sign-in can be smoke-tested in Expo Go on a physical iOS device. Production and Simulator capability setup need an Apple Developer Program account + `usesAppleSignIn`.

**App Store note:** If you offer Google login, Apple requires Sign in with Apple as an equivalent option before App Store release.

### Identity linking

If a user already has an email account and later signs in with Google using the **same verified email**, Supabase may link identities or reject the login depending on your project’s Auth settings (automatic linking / manual linking). TripApp does **not** merge accounts with insecure client-side logic. Prefer enabling linking in the Supabase dashboard when you need it.

## Google Cloud setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Configure the **OAuth consent screen**.
3. Create OAuth clients:
   - **Web application** → copy Client ID → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and Supabase Google provider Client IDs.
   - **iOS** → bundle ID `com.tripapp.app` → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
   - **Android** → package `com.tripapp.app` + SHA-1 fingerprint → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (optional in app code; required in Google Cloud).
4. Rebuild the native app after changing the iOS client ID (config plugin derives `iosUrlScheme`).

### Android SHA-1

```bash
# Debug keystore example
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Use the SHA-1 in the Google Cloud Android OAuth client.

## Supabase provider setup

### Google

1. **Authentication → Providers → Google** → enable.
2. Paste the **Web client ID** (and iOS client ID if prompted) into Client IDs.
3. Leave Client Secret empty for native ID-token-only flows (or follow dashboard guidance if shown).
4. Enable **Skip nonce check** for native Expo Google Sign-In.
5. Save.

### Apple

What works in code now without finishing Apple Developer setup:

- Official Apple button UI on iOS when `isAvailableAsync()` is true
- Secure nonce + `signInWithIdToken` path
- Graceful “pending configuration” messaging when unavailable
- Email + Google still work

What you must configure later with Apple Developer Program:

1. App ID `com.tripapp.app` with **Sign in with Apple** capability
2. Enable Apple provider in **Supabase → Authentication → Providers → Apple**
3. For **native-only** iOS, Client IDs typically include the App ID / bundle ID audience
4. Services ID + key + secret are needed for **web OAuth** Apple flows — **not required** for this native-only mobile path
5. Rebuild with `ios.usesAppleSignIn: true` (already set in `app.config.ts`)

## Development build

Google Sign-In requires a development build:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

Or use EAS Build for a `development` profile. Do not commit generated credentials.

Email auth and development Preview continue to work in Expo Go.

## Manual test plan

1. Email create account / sign in / sign out (regression).
2. Missing Google env → polished configuration message; no crash.
3. Google success (dev build) → Home + profile; restart app → session restores.
4. Google cancel → no error alert.
5. Apple unavailable → clear pending-configuration message.
6. Apple available → official button; cancel → no error alert.
7. Android → no Apple button (fallback control shows pending message); Google + email available.
8. Preview still development-only.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npx expo-doctor
npm run start
```

## Styling rules

Unchanged: colocated `*.styles.ts`, theme tokens only, no static inline styles, thin `app/` routes.

## Security warnings

- Never commit `.env`.
- Never ship service-role keys or OAuth client secrets in the app.
- Do not log ID tokens, access tokens, authorization codes, or nonces.
