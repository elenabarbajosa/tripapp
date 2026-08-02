# TripApp

Collaborative travel planning for solo travellers, couples, families, and groups.

**Plan the trip together. Keep everything in one place.**

## Phase status

**Phase 3A UX polish:** Create-trip wizard now uses native date pickers, searchable countries, automatic currency, and a four-step flow. Invitations still deferred to Phase 3B.

**Still upcoming**

- **Phase 3B:** Invitation records, emails, share links, deep-link accept, role-change UI, member removal
- **Later:** Itinerary, bookings, expenses, voting, maps, ads/paywalls

## Stack

| Layer | Choice |
| --- | --- |
| App | Expo SDK 57, React Native, TypeScript (strict) |
| Routing | Expo Router (`Stack.Protected`) |
| Auth | Supabase Auth — email, Google ID token, Apple ID token |
| Data | Supabase Postgres + RLS |
| Server state | TanStack React Query |
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

## Phase 3A — Trips foundation

### Apply migrations

1. `supabase/migrations/20260802010000_create_trips.sql` (tables + original RPC)
2. `supabase/migrations/20260802020000_destination_currency.sql` (destination `currency_code` / `country_code` + updated `create_trip`)

**Option A — Supabase SQL Editor**

1. Open your Supabase project → **SQL Editor**.
2. Run each migration file in order (after profiles).

**Option B — Supabase CLI**

```bash
npx supabase db push
```

### Create-trip wizard (4 steps)

1. **Basics** — name, start/end dates (calendar + DD/MM/YYYY typing), optional cover URL  
2. **Destinations** — city, searchable country, arrival/departure dates  
3. **Travellers** — solo or invite later (invitations in 3B)  
4. **Review** — summary + create

There is **no** separate currency step. Latitude/longitude are not shown; columns stay nullable for later Geoapify geocoding.

### Date picker architecture

- Component: `DateField` using `@expo/ui/community/datetime-picker`
- Android: native dialog; iOS: inline calendar in a modal
- Accent colour: theme `colors.primary`
- Form + DB store **date-only** `YYYY-MM-DD`
- Display (English UI): **DD/MM/YYYY**
- Conversions use **local calendar parts** (not UTC midnight) so timezone/DST cannot shift the selected day

### Country + currency

- Dataset: static `countries-list` (no network)
- Search: name, native name, alpha-2, alpha-3, aliases — trimmed, case-insensitive, diacritic-insensitive
- Selecting a country sets `country_code` and primary `currency_code`
- Single-country trip → `trips.currency` = that currency  
- Multi-country trip → each destination keeps its currency; `trips.currency` = **first destination** currency (change later in Trip Settings)
- Profile `preferred_currency` is stored as `trips.home_currency` only — it does not overwrite trip currency

### Database objects created

| Object | Purpose |
| --- | --- |
| `trip_member_role` enum | `owner`, `editor`, `viewer` |
| `trips` | Trip header (`currency` = primary/base currency) |
| `trip_destinations` | Ordered destinations + `country_code` + `currency_code` |
| `trip_days` | One row per calendar day in the trip range |
| `trip_members` | Accepted membership + role (`accepted` / `left`) |

### RLS helpers & RPC

| Function | Role |
| --- | --- |
| `is_accepted_trip_member(trip_id)` | Membership gate used by RLS |
| `get_trip_role(trip_id)` | Current user's role |
| `is_trip_owner(trip_id)` | Owner check |
| `can_edit_trip(trip_id)` | Owner or editor |
| `create_trip(...)` | Atomic create: trip + owner + destinations + days; trip currency from first destination |

### Manual test plan (create-trip UX)

1. **Spain solo** — pick Spain → EUR shown → calendar dates → create → Overview  
2. **US + Canada** — USD then CAD on destinations; Review shows primary USD  
3. **Manual dates** — type `12/09/2026`; try invalid `31/02/2026`; end before start blocked  
4. **Country search** — `sp`, `ES`, `united`  
5. **Same-day transition** — destination A ends on day X, B starts on day X  
6. Home/Overview still load for authenticated trips  
7. Expo Go still starts (Google remains lazy / unavailable)

### RLS policies (summary)

- **trips:** members select; creator insert; owner update/delete
- **trip_destinations / trip_days:** members select; owners/editors write
- **trip_members:** members select; owner update (no direct insert/delete in 3A — create via RPC)
- **profiles:** existing own-profile policies + `profiles_select_trip_co_members` for fellow travellers

### App behaviour

- Authenticated Home loads real trips via React Query; Preview keeps mock Midwest data + mock invitations UI.
- Create-trip wizard: Basics → Destinations → Travellers → Review (4 steps).
- Group screen lists accepted members + roles (invite UI disabled until 3B).
- Overview shows live trip header; itinerary/budget/votes extras stay mock-only in Preview.
- Trip settings shows live basics; owners can delete a trip.

## Authentication (Phase 2)

### Email

Always available as a fallback.

### Google (native ID token)

Requires a **development build** (not Expo Go). Enable **Skip nonce check** for Google in Supabase.

### Apple (native ID token)

Official button on iOS when available. Apple Developer Program setup still required for production.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npx expo-doctor
npm run start
```

## Styling rules

Colocated `*.styles.ts`, theme tokens only, no static inline styles, thin `app/` routes.

## Security warnings

- Never commit `.env`.
- Never ship service-role keys or OAuth client secrets in the app.
- Do not log ID tokens, access tokens, authorization codes, or nonces.
- Trip access is enforced with Postgres RLS — do not rely on client checks alone.
