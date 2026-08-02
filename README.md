# TripApp

Collaborative travel planning for solo travellers, couples, families, and groups.

**Plan the trip together. Keep everything in one place.**

## Phase status

**Phase 4 complete (current):** Itinerary, Geoapify places, bookings, expenses, packing, and ideas/voting.

**Still upcoming (do not start yet — Phase 5+)**

- Live airline / hotel / train / restaurant provider APIs
- Maps, directions, push notifications, offline mode
- AI recommendations, monetization, social profiles / public feeds

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
| Email | Supabase Edge Function + Resend (optional) |

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

# Optional web/deep-link base for invites (falls back to tripapp://invite/{token})
EXPO_PUBLIC_INVITATION_BASE_URL=

# Edge Function secrets only (never EXPO_PUBLIC_):
# RESEND_API_KEY=
# INVITATION_FROM_EMAIL=
```

Never commit `.env` or service-role keys. Never put Google/Apple client **secrets** or Resend keys in the app.

## Apply migrations

Run in order:

1. `20260802000000_create_profiles.sql`
2. `20260802010000_create_trips.sql`
3. `20260802020000_destination_currency.sql`
4. `20260802030000_trip_invitations.sql` ← Phase 3B invitations
5. `20260802040000_fix_trip_members_access.sql` ← Group member load / RLS recursion fix
6. `20260802050000_trip_itinerary.sql` ← Phase 4A itinerary activities
7. `20260802060000_activity_places.sql` ← Phase 4A.1 Geoapify place fields
8. `20260802070000_trip_bookings.sql` ← Phase 4B bookings
9. `20260802080000_trip_expenses.sql` ← Phase 4C expenses + settlements
10. `20260802090000_trip_packing.sql` ← Phase 4D packing
11. `20260802100000_trip_ideas.sql` ← Phase 4E ideas + voting

**Option A — Supabase SQL Editor:** run each file in order.

**Option B — CLI:**

```bash
npx supabase db push
```

If CLI login is unavailable, paste `20260802060000_activity_places.sql` into the SQL Editor after the itinerary migration.

### Deploy invitation email Edge Function (optional)

```bash
npx supabase functions deploy send-invitation-email
npx supabase secrets set RESEND_API_KEY=... INVITATION_FROM_EMAIL="TripApp <invites@yourdomain.com>"
```

If Resend is not configured, invitation **creation still works**. The app shows a copy/share link and a friendly note that email delivery is unavailable.

## Create-trip (Phase 3A + corrections)

### Wizard (4 steps)

1. Basics — name, start/end dates, optional cover URL  
2. Destinations — city, searchable country, arrival/departure  
3. Travellers — solo or invite later  
4. Review — create

### Destination date rules

```text
tripStartDate <= arrivalDate <= departureDate <= tripEndDate
```

Required validation messages:

- `Arrival date must be within the trip dates.`
- `Departure date must be on or after the arrival date.`
- `Departure date must be on or before the trip end date.`

### Calendar (`DateField`)

- Manual `DD/MM/YYYY` typing + ISO `YYYY-MM-DD` storage (local calendar parts, no UTC day-shift)
- **iOS:** app-controlled sheet with `@expo/ui/community/datetime-picker` (`mode="date"`, `display="inline"`), Cancel / Done, pending selection until Done
- **Android:** native date dialog; commit on confirm only
- Accent: theme `colors.primary` (`#2563EB`)

### Additional destination defaults

When adding another stop:

- New arrival = previous stop departure  
- New departure = previous stop departure (same-day handoff is valid)  
- Values clamped inside overall trip dates  
- Reordering preserves selected dates; edits are not silently overwritten

### After successful create

1. Confirm trip ID from `create_trip`  
2. Invalidate Home trip queries  
3. Clear draft only after success  
4. `router.replace("/(main)/home")` (wizard removed from history)  
5. On failure: stay on Review, preserve values, show one inline error (no duplicate Alert)

## Phase 3B — Invitations & members

### Schema

| Object | Purpose |
| --- | --- |
| `trip_invitation_status` | `pending`, `accepted`, `declined`, `revoked`, `expired` |
| `trip_invitations` | Email + share-link invites; stores **token hash only** |

### Security model

- Raw invite tokens are generated server-side and returned **once**; only SHA-256 hex hashes are stored
- Email invitations normalize email (trim + lowercase) and require case-insensitive match on accept/decline
- Share links omit `invited_email`
- Only pending, non-expired invitations can be accepted
- Membership changes go through SECURITY DEFINER RPCs (no client INSERT into `trip_members`)
- Exactly one owner; transfer demotes previous owner to editor
- Owner cannot leave or remove themselves without transferring first

### RPCs

| RPC | Who | Purpose |
| --- | --- | --- |
| `create_trip_invitation` | Owner | Email invite; returns raw token once |
| `create_trip_share_link` | Owner | Share invite; returns raw token once |
| `get_trip_invitation_preview` | Anon + auth | Safe preview by raw token |
| `accept_trip_invitation` / `_by_id` | Auth | Accept → membership |
| `decline_trip_invitation` / `_by_id` | Auth | Decline pending |
| `revoke_trip_invitation` | Owner | Revoke pending |
| `update_trip_member_role` | Owner | editor ↔ viewer |
| `remove_trip_member` | Owner | Mark member `left` |
| `leave_trip` | Editor/viewer | Leave trip |
| `transfer_trip_ownership` | Owner | Atomic ownership transfer |
| `list_my_pending_invitations` | Auth | Home pending email invites |

### RLS (`trip_invitations`)

- Owners: select invitations for their trips  
- Invitees: select pending invites matching their email  
- No client insert/update/delete — mutations via RPCs only  
- Token lookup for share links uses `get_trip_invitation_preview`, not broad table access

### App surfaces

| Surface | Behaviour |
| --- | --- |
| Home | Live pending invitations (Accept / Decline); Preview keeps mock isolation |
| Group | Members, roles, invite, revoke, remove, transfer, leave |
| Invite traveller | Email + share-link modes; copy / native share |
| `app/invite/[token]` | Deep-link preview; auth resume via pending token storage |

Deep link scheme: `tripapp://invite/{token}` (or `EXPO_PUBLIC_INVITATION_BASE_URL`).

### Permission helpers

`canInviteMembers`, `canManageMemberRoles`, `canRemoveMember`, `canTransferOwnership`, `canLeaveTrip`, `canRevokeInvitation` — UI only; RLS/RPCs are the real security layer.

## Phase 4A — Day-by-day itinerary

### Scope

- View trip days and activities for a selected day
- Create, edit, delete activities (owner/editor)
- Reorder within a day via Move Up / Move Down (no drag-and-drop dependency)
- Viewer read-only; unrelated users have no access (RLS)

### Activity schema (`trip_activities`)

| Column | Notes |
| --- | --- |
| `trip_id` / `trip_day_id` | Day must belong to the same trip |
| `destination_id` | Optional; must belong to the same trip when set |
| `category` | `activity`, `sightseeing`, `food`, `nightlife`, `shopping`, `transport`, `other` |
| `is_all_day` / `start_time` / `end_time` | All-day clears times; timed may omit end; end ≥ start |
| `position` | Manual order within the day |

Helpers: `trip_day_belongs_to_trip`, `trip_destination_belongs_to_trip`  
RPC: `reorder_trip_activities(p_trip_id, p_trip_day_id, p_activity_ids)`

### Permissions

| Role | View | Create / edit / delete / reorder |
| --- | --- | --- |
| Owner | Yes | Yes |
| Editor | Yes | Yes |
| Viewer | Yes | No |
| Unrelated | No | No |

Client helpers: `canViewItinerary`, `canCreateActivity`, `canEditActivity`, `canDeleteActivity`, `canReorderActivities` — presentation only. RLS remains authoritative.

### Ordering rule

Within a day, activities sort as:

1. All-day activities first  
2. Then by `start_time` ascending (null start times last among timed)  
3. Then by `position` ascending  
4. Then by `created_at` ascending (stable fallback)

### Routes

| Route | Purpose |
| --- | --- |
| `app/trips/[tripId]/(tabs)/itinerary.tsx` | Itinerary tab |
| `app/trips/[tripId]/activities/new.tsx` | Add activity |
| `app/trips/[tripId]/activities/[activityId]/edit.tsx` | Edit activity |

Navigation always passes explicit `{ tripId }` (and `activityId` / `dayId` when needed). Invalid UUIDs show a local error without calling Supabase.

### Migration

```bash
# After earlier migrations are applied:
npx supabase db push
# Or paste supabase/migrations/20260802050000_trip_itinerary.sql in the SQL Editor
```

## Phase 4A.1 — Geoapify location autocomplete

### Scope

- Location autocomplete on Add / Edit Activity via Geoapify Address Autocomplete
- One authenticated Supabase Edge Function proxies Geoapify (API key never in the app)
- Manual location entry always remains available
- No map, markers, directions, nearby recommendations, or bookings in this phase

### Architecture

```text
Activity form → getPlaceSuggestions() → supabase.functions.invoke("geoapify-autocomplete")
  → GET https://api.geoapify.com/v1/geocode/autocomplete
```

The Geoapify API key stays in Edge Function secrets so it is never shipped in Expo/`EXPO_PUBLIC_*`/Git.

### Stored place fields

Added on `trip_activities` (nullable; `location_name` / `address` retained for manual entry):

| Column | Notes |
| --- | --- |
| `geoapify_place_id` | Provider place id (max 256) |
| `latitude` / `longitude` | WGS84; both null or both set |

Editing location name or address after a selection clears provider metadata so coordinates never drift from visible text.

### Client behaviour

- Search starts at 3+ characters
- 400 ms debounce, in-memory session cache, stale-response ignore, max 5 suggestions
- Destination country code used as optional Geoapify **bias** only
- Attribution: **Powered by Geoapify** under visible suggestions

### Deploy Edge Function + secret

```bash
npx supabase db push
# or paste supabase/migrations/20260802060000_activity_places.sql

npx supabase functions deploy geoapify-autocomplete
npx supabase secrets set GEOAPIFY_API_KEY=YOUR_GEOAPIFY_KEY_HERE
```

Do **not** deploy with `--no-verify-jwt`. Do **not** put the key in app `.env` or `EXPO_PUBLIC_*`.

## Phase 4B — Bookings and reservations

Manual booking entry only (no live provider APIs, ticket uploads, or OCR).

### Scope

- Accommodation, flight, train, bus, car rental, restaurant, activity, other
- Owner/editor create / edit / delete; viewer read + copy confirmation/reference
- Filters: All, Stays, Transport, Food, Activities, Other
- Groups: Upcoming, Previous, Undated
- Geoapify PlaceAutocompleteField reused for stays / restaurants / activities / other

### Schema

Enum `trip_booking_type`. Table `trip_bookings` with confirmation fields, dates/times, location metadata, transport fields, check-in/out. Constraints enforce blank titles, date/time ordering, and paired lat/lng. Never store payment-card data.

### Routes

| Route | Purpose |
| --- | --- |
| `app/trips/[tripId]/bookings/index.tsx` | List |
| `app/trips/[tripId]/bookings/new.tsx` | Create |
| `app/trips/[tripId]/bookings/[bookingId]/index.tsx` | Detail |
| `app/trips/[tripId]/bookings/[bookingId]/edit.tsx` | Edit |

Explicit `{ tripId }` / `{ bookingId }` params required. Permission helpers: `canViewBookings`, `canCreateBooking`, `canEditBooking`, `canDeleteBooking`.

### Migration

```bash
npx supabase db push
# or paste supabase/migrations/20260802070000_trip_bookings.sql
```

## Phase 4C — Expenses and group splitting

Track shared spending and settlements. No banks, FX conversion, receipt uploads, or real money transfers.

### Scope

- Categories: accommodation, transport, food, activities, shopping, other
- Split methods: equal, exact amounts, percentages
- Balances per member **per currency** (currencies never mixed)
- Settlements record that a repayment happened; they do not move money

### Money

Amounts stored as integer **minor units** (`amount_minor`). Client helpers in `src/utils/money.ts` format/parse and allocate equal/percentage remainders deterministically.

### Secure RPCs

`create_trip_expense`, `update_trip_expense`, `delete_trip_expense`, `record_trip_settlement`, `delete_trip_settlement` — `SECURITY DEFINER` with safe `search_path`, auth checks, member validation, and exact split totals. Direct table writes for mutations are blocked where RPCs are required.

### Balance formula (per user + currency)

```text
balance = expenses paid − shares owed + settlements sent − settlements received
```

Positive = is owed; negative = owes; zero = settled.

### Routes

| Route | Purpose |
| --- | --- |
| `app/trips/[tripId]/expenses/index.tsx` | Overview |
| `app/trips/[tripId]/expenses/new.tsx` | Add expense |
| `app/trips/[tripId]/expenses/[expenseId]/index.tsx` | Detail |
| `app/trips/[tripId]/expenses/[expenseId]/edit.tsx` | Edit |
| `app/trips/[tripId]/expenses/settlements/new.tsx` | Record settlement |

Helpers: `canViewExpenses`, `canManageExpenses`, `canRecordSettlement`.

### Migration

```bash
npx supabase db push
# or paste supabase/migrations/20260802080000_trip_expenses.sql
```

## Phase 4D — Collaborative packing lists

Shared + personal packing items with progress, filters, assignment, and reorder.

### Scope

- Categories: clothes, toiletries, electronics, documents, medication, travel, other
- Scope: `shared` | `personal` (personal requires assignee who is an accepted member)
- Owner/editor manage any item and reorder; accepted members toggle shared / self-assigned items and manage their own personal items
- Realtime subscription on `trip_packing_items` for the active trip (subscribe while mounted; clean up on unmount)

### Secure RPCs

- `toggle_trip_packing_item` — packs/unpacks and sets/clears `packed_by` / `packed_at` atomically
- `reorder_trip_packing_items` — owner/editor only; validates ids belong to the trip

### Routes

| Route | Purpose |
| --- | --- |
| `app/trips/[tripId]/packing/index.tsx` | List + progress |
| `app/trips/[tripId]/packing/new.tsx` | Add item |
| `app/trips/[tripId]/packing/[itemId]/edit.tsx` | Edit item |

Helpers: `canViewPacking`, `canCreatePackingItem`, `canEditPackingItem`, `canDeletePackingItem`, `canTogglePackingItem`, `canReorderPackingItems`.

### Migration

```bash
npx supabase db push
# or paste supabase/migrations/20260802090000_trip_packing.sql
```

## Phase 4E — Ideas and voting

Propose ideas, upvote, archive, and promote winners into the itinerary.

### Scope

- Categories: sightseeing, food, activity, nightlife, shopping, transport, other
- Status: proposed → added_to_itinerary | archived
- Any accepted member may create ideas and vote (one vote per member per idea)
- Creator may edit/delete own **proposed** idea; owner/editor manage any, archive, promote
- Geoapify PlaceAutocompleteField reused on idea forms
- Realtime on `trip_ideas` + `trip_idea_votes`

### Promote RPC

`promote_trip_idea_to_activity` — owner/editor only; creates a real `trip_activities` row (copies title, description, category mapping, location/Geoapify metadata), sets idea status + `promoted_activity_id`, rejects duplicate promotion, validates day/destination ownership.

### Routes

| Route | Purpose |
| --- | --- |
| `app/trips/[tripId]/ideas/index.tsx` | Ranked list |
| `app/trips/[tripId]/ideas/new.tsx` | Suggest |
| `app/trips/[tripId]/ideas/[ideaId]/edit.tsx` | Edit |
| `app/trips/[tripId]/ideas/[ideaId]/add-to-itinerary.tsx` | Promote |

Helpers: `canViewIdeas`, `canCreateIdea`, `canVoteOnIdea`, `canEditIdea`, `canDeleteIdea`, `canArchiveIdea`, `canPromoteIdea`.

### Migration

```bash
npx supabase db push
# or paste supabase/migrations/20260802100000_trip_ideas.sql
```

## Manual test plan

### Create trip

1. Arrival `02/08/2026`, departure `03/08/2026` → valid  
2. Open iOS calendar → change month → tap day → Done commits; Cancel keeps prior value  
3. Add destination → both dates default to previous departure  
4. Create → lands on Home with the new trip; Back does not reopen Review  

### Email invitation

1. Account A creates a trip and invites Account B as editor  
2. Account B sees invitation on Home → Accept  
3. Trip appears for B; Group shows both members  

### Share invitation

1. Owner generates viewer link → copy/share  
2. Another account opens `tripapp://invite/...` → Accept → joins as viewer  

### Roles / ownership / leave

1. Owner changes viewer → editor; removes a member  
2. Editor/viewer cannot manage members  
3. Owner transfers ownership → exactly one owner; previous becomes editor  
4. Viewer/editor can leave; owner is blocked until transfer  

### Invitation states

Decline, revoke, expire, email mismatch, already accepted / already member.

### Itinerary (Phase 4A)

1. Open a trip → **Itinerary** tab  
2. Confirm day chips load from real `trip_days`; today is selected when inside the trip, otherwise day 1  
3. Owner/editor: **Add activity** → fill title, day, optional times → save → appears on the day  
4. Edit activity → change category/location → save  
5. Move Up / Down → order persists after refresh  
6. Delete → confirmation required → activity removed  
7. Sign in as viewer on the same trip → can read; no add/edit/delete/reorder controls  
8. Unrelated account → cannot open itinerary data for that trip  

### Location autocomplete (Phase 4A.1)

1. Deploy `geoapify-autocomplete` and set `GEOAPIFY_API_KEY`  
2. Add activity → type “Art Institute of Chicago” → suggestions appear after 3 characters  
3. Select a suggestion → location name, address, and coordinates populate  
4. Save → reopen edit → selected place state restored  
5. Edit the location text → place id / lat / lng clear; save as manual location  
6. With secret unset or function stopped → friendly message; manual entry still works  

### Bookings (Phase 4B)

1. Trip → More → Bookings → Add accommodation (Geoapify or manual) → save  
2. Add flight with departure/arrival → open detail → copy confirmation → edit → delete (confirm)  
3. Viewer: read-only; can copy confirmation; no add/edit/delete  

### Expenses (Phase 4C)

1. Trip → More → Expenses → add equal split → add exact → add percentage  
2. Review totals and balances by currency → record settlement → balances update  
3. Viewer: can view; cannot add expenses or settlements  

### Packing (Phase 4D)

1. Trip → More → Packing → add shared item → add personal item assigned to a traveller  
2. Toggle packed → progress updates → filter Shared / Mine / Packed / Unpacked  
3. Owner/editor reorder; viewer toggles shared/self-assigned only  

### Ideas (Phase 4E)

1. Trip → More → Ideas → add idea → vote → remove vote → sort Top / Newest  
2. Owner/editor: Add to itinerary → pick day → confirm → activity appears on Itinerary  
3. Viewer: can propose and vote; cannot promote or manage others’ ideas  

### Permissions matrix

Test owner, editor, viewer, and an unrelated account against bookings, expenses, packing, and ideas.

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
- Never ship service-role keys, Resend keys, or OAuth client secrets in the app.
- Do not log invitation tokens, auth tokens, passwords, or full personal data payloads.
- Trip access is enforced with Postgres RLS — do not rely on client checks alone.

## Known limitations

- Invitation email requires Resend secrets; without them, copy/share still works  
- Share-link Home cards are not listed (email-matched only); open the link to accept  
- Expired invitations are marked lazily on read/mutation  
- Preview mode continues to use mock invitations only  
- **Create-trip date picker / validation UX** remains deferred (not modified in Phase 4B–4E)  
- Itinerary reorder uses Move Up / Move Down only (no drag-and-drop)  
- **No** live airline, hotel, train, or restaurant provider APIs  
- **No** email inbox parsing, ticket/receipt uploads, or OCR  
- **No** real payment transfers or banking integrations  
- **No** automatic currency conversion (multi-currency balances stay separate)  
- **No** visible maps, directions, push notifications, offline mode, AI recommendations, or monetization  
- **No** social profiles or public feeds  
- Place search quality depends on Geoapify / OpenStreetMap data  
- Geoapify autocomplete requires the Edge Function + `GEOAPIFY_API_KEY` secret  
