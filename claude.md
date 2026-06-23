# MyAllergy — Claude Code Brief

## What we're building

A web app for storing and sharing allergy and dietary profiles. The primary value props are:

1. Store yours or a child's allergens with severity, date, and notes
2. Cross-match against Open Food Facts to check packaged food (search + barcode scan)
3. Generate a shareable public link so schools, caterers, events, and health organisations can view a profile without needing an account

---

## Stack (all free tier)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Auth + DB | Supabase (Postgres + RLS) |
| Barcode scanning | `@zxing/library` (in-browser) |
| Food database | Open Food Facts API (no key needed) |
| Hosting | Vercel |
| State | Zustand |
| Routing | React Router v6 |

---

## Database schema

Run `supabase/schema.sql` in the Supabase SQL editor to set up the DB.

### Tables

**profiles**
- `id` uuid PK
- `user_id` uuid → auth.users
- `name` text
- `dob` date (optional)
- `avatar_emoji` text
- `is_default` boolean
- `share_token` uuid (unique, generated on creation — used for public share links)
- `share_enabled` boolean default false
- `created_at`, `updated_at`

**allergens**
- `id` uuid PK
- `profile_id` uuid → profiles
- `name` text
- `category` text
- `severity` enum: mild | moderate | severe | anaphylactic
- `diagnosed_date` date
- `notes` text
- `off_tag` text (Open Food Facts allergen tag, e.g. `en:peanuts`)
- `created_at`, `updated_at`

**dietary_flags**
- `id` uuid PK
- `profile_id` uuid → profiles
- `flag` text (e.g. halal, kosher, vegan, vegetarian, gluten-free, dairy-free, nut-free)
- `notes` text
- `created_at`

**scan_history**
- `id` uuid PK
- `profile_id` uuid → profiles
- `barcode` text
- `product_name` text
- `brand` text
- `image_url` text
- `result` text: safe | unsafe | warning | unknown
- `flagged_allergens` jsonb
- `scanned_at` timestamptz

All tables use Row Level Security. Profiles, allergens, dietary_flags, and scan_history are only accessible by the owning user — except the public share route which reads via `share_token` with a separate RLS policy allowing anonymous select when `share_enabled = true`.

---

## Pages / routes

| Route | Page | Notes |
|---|---|---|
| `/auth` | Sign in / Sign up | Email + password via Supabase |
| `/` | Dashboard | Active profile summary, quick actions |
| `/profiles` | Profile manager | Create, edit, delete, set default |
| `/allergens` | Allergen manager | Add/remove allergens for active profile |
| `/dietary` | Dietary flags | Halal, kosher, vegan, etc. for active profile |
| `/scanner` | Barcode scanner | Camera scan + manual barcode entry |
| `/search` | Food search | Search Open Food Facts by name |
| `/history` | Scan history | Last 50 scans for active profile |
| `/s/[token]` | Public share page | Read-only, no auth required |

---

## Sharing feature

### How it works
- Each profile has a `share_token` (uuid) and `share_enabled` (boolean)
- Owner can toggle sharing on/off per profile
- When enabled, anyone with `myallergy.app/s/[token]` can view:
  - Profile name and avatar
  - All allergens grouped by severity
  - Dietary flags (halal, kosher, vegan, etc.)
  - A print-friendly layout
- No editing, no scanning, no account required on the share page

### RLS policy for share page
```sql
create policy "public_share_select" on profiles
  for select using (share_enabled = true);

create policy "public_share_allergens" on allergens
  for select using (
    profile_id in (
      select id from profiles where share_enabled = true
    )
  );

create policy "public_share_dietary" on dietary_flags
  for select using (
    profile_id in (
      select id from profiles where share_enabled = true
    )
  );
```

---

## Key libraries

```json
{
  "@supabase/supabase-js": "^2.45.0",
  "@zxing/library": "^0.21.3",
  "date-fns": "^3.6.0",
  "lucide-react": "^0.383.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "zustand": "^4.5.4"
}
```

---

## Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Design direction

- App name: **MyAllergy**
- Clean, medical-adjacent but approachable — not clinical
- Green as the primary accent (safety, safe-to-eat)
- Red/amber for warnings and unsafe results
- Mobile-first — the scanner especially needs to work well on a phone
- Sidebar on desktop, bottom nav on mobile

---

## EU Big 14 allergens (with Open Food Facts tags)

Pre-populate the quick-add list with these:

| Name | OFF tag |
|---|---|
| Peanuts | en:peanuts |
| Tree nuts | en:nuts |
| Milk | en:milk |
| Eggs | en:eggs |
| Gluten | en:gluten |
| Wheat | en:wheat |
| Soy | en:soybeans |
| Fish | en:fish |
| Shellfish | en:crustaceans |
| Sesame | en:sesame-seeds |
| Mustard | en:mustard |
| Celery | en:celery |
| Lupin | en:lupin |
| Sulphites | en:sulphur-dioxide-and-sulphites |
| Molluscs | en:molluscs |

---

## Dietary flags (pre-defined options)

halal, kosher, vegan, vegetarian, pescatarian, gluten-free, dairy-free, nut-free, low-FODMAP, diabetic-friendly

---

## Open Food Facts integration

Base URL: `https://world.openfoodfacts.org/api/v0`

- Barcode lookup: `GET /product/{barcode}.json`
- Search: `GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=...&json=1`
- No API key required
- Allergen tags live in `product.allergens_tags` (array of strings like `"en:peanuts"`)
- Traces in `product.traces_tags`
- Ingredients text in `product.ingredients_text`

Assessment logic: check allergen tags first, then traces (show as warning not unsafe), then fall back to ingredient text search.

---

## What's already been discussed but NOT yet built

- Permission tiers for sharing (public / restricted by email / private) — V2
- PWA / installable on mobile — V2
- Printable allergy card PDF — V2
- Manual ingredient paste checker — V2

---

## Instructions for Claude Code

Build this from scratch, file by file. Check in before writing more than a couple of files at a time. Ask before making architectural decisions. The owner will review and confirm at each step.
