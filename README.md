# PitchUp (პიჩაპი)

Learn to sell by talking to an AI customer. Pick a profession, call a realistic AI customer (voice or text), handle objections, close — and get scored on 6 skills. Levels, XP, badges, free + paid courses, English + Georgian.

**Stack:** Next.js 15 (App Router) · Tailwind 4 · next-intl (`/ka`, `/en`) · Prisma + Supabase (PostgreSQL) · Supabase Auth (Google + email) · Gemini Live (voice) + Gemini (text, scoring) · Dodo Payments · Vercel.

## Run locally

```bash
npm install
cp .env.example .env      # paste your Supabase DATABASE_URL + DIRECT_URL (see step 4 below)
npx prisma migrate deploy # create tables
npx prisma db seed        # 10 professions, 40 courses, 30 AI scenarios, badges
npm run dev               # http://localhost:3000
```

With no keys set, the site still works end-to-end:

| Missing key | What happens |
|---|---|
| Supabase Auth (`SUPABASE_URL`) | Login page shows **"Log in as demo student / demo admin"** (dev only, never in production) |
| `GEMINI_API_KEY` | Calls run in text mode with canned customer replies; scoring uses a simple heuristic |
| Dodo Payments | Buy buttons show "not configured" |

Tests: `npm test`

## Project map

| Path | What |
|---|---|
| `prisma/schema.prisma`, `prisma/seed.ts` | Data model and seed content |
| `messages/ka.json`, `messages/en.json` | All UI text |
| `src/app/[locale]/…` | Pages (landing, courses, practice, call, results, dashboard, admin…) |
| `src/app/api/…` | Auth session, calls, checkout, Dodo webhook, data export |
| `src/lib/ai.ts` | Persona prompt, text replies, scoring, Live ephemeral token |
| `src/lib/live-voice.ts` | Browser mic ↔ Gemini Live audio streaming |
| `src/lib/levels.ts` | XP / level / streak rules |
| `src/lib/access.ts` | Plan checks, daily call limits, max call length |
| `src/lib/payments.ts` | All Dodo Payments code (checkout, webhook signature, granting access) |
| `src/lib/admin-config.ts` | One config that drives the admin CRUD screens |

Rules: free = 3 calls/day, 5 min, levels 1–3 · guest = 1 demo call/day per IP, 2 min · Pro = unlimited, 20 min, all levels and paid courses. Hard needs level 3, Boss needs level 5 + Pro.

## Deploy to Google Cloud

Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install), then:

### 1. Project and APIs

```bash
gcloud projects create pitchup-prod
gcloud config set project pitchup-prod
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com aiplatform.googleapis.com storage.googleapis.com \
  identitytoolkit.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create pitchup --repository-format=docker --location=europe-west3
```

Billing must be enabled on the project (Console → Billing).

### 2. Supabase Authentication

1. Supabase dashboard → **Project Settings → API**: copy the project URL and the `anon` public key into `SUPABASE_URL` / `SUPABASE_ANON_KEY`. Optional: the `service_role` key into `SUPABASE_SERVICE_ROLE_KEY` (secret; lets account deletion remove the login too).
2. Set `SESSION_SECRET` to a random string (`openssl rand -base64 32`).
3. **Authentication → URL Configuration**: Site URL = your domain; Redirect URLs: `https://YOUR_DOMAIN/**` and `http://localhost:3000/**`.
4. Email/password works out of the box (users confirm their email by link).
5. Google: create an OAuth client (Google Cloud Console → APIs & Services → Credentials → OAuth client ID → Web) with redirect URI `https://YOUR_REF.supabase.co/auth/v1/callback`, then paste its ID and secret in **Authentication → Providers → Google**. The Google button appears automatically once it's enabled.

### 3. OAuth consent screen

Console → **APIs & Services → OAuth consent screen**:
- App name: **PitchUp**
- Logo: upload `public/logo-mark-120.png`
- Support email: yours
- Privacy policy: `https://YOUR_DOMAIN/en/privacy` · Terms: `https://YOUR_DOMAIN/en/terms`
- Authorized domain: your domain

### 4. Supabase (PostgreSQL)

1. https://supabase.com → **New project**. Region: Frankfurt (`eu-central-1`, closest to Georgia). Set a strong database password and save it.
2. Top bar **Connect** → **ORMs** → **Prisma**. Copy the two strings into `.env`:
   - `DATABASE_URL`: pooled, port **6543**, ends with `?pgbouncer=true`. Add `&connection_limit=5`.
   - `DIRECT_URL`: port **5432**, used only by migrations.
3. Create the tables and seed data (once):

```bash
npx prisma migrate deploy
npx prisma db seed
```

The app reaches Supabase only through Prisma on the server; the browser only talks to Supabase Auth to log in, never to the database.

### 5. Secrets

```bash
printf '%s' 'SUPABASE_POOLED_URL_6543' | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' 'SUPABASE_DIRECT_URL_5432' | gcloud secrets create DIRECT_URL --data-file=-
printf '%s' "$(openssl rand -base64 32)" | gcloud secrets create SESSION_SECRET --data-file=-
printf '%s' 'dodo_live_...'       | gcloud secrets create DODO_PAYMENTS_API_KEY --data-file=-
printf '%s' 'whsec_...'           | gcloud secrets create DODO_WEBHOOK_KEY --data-file=-
printf '%s' 'AIza...'             | gcloud secrets create GEMINI_API_KEY --data-file=-
```

Give the Cloud Run service account access:

```bash
PN=$(gcloud projects describe pitchup-prod --format='value(projectNumber)')
gcloud projects add-iam-policy-binding pitchup-prod --member="serviceAccount:$PN-compute@developer.gserviceaccount.com" --role=roles/secretmanager.secretAccessor
# Cloud Build needs to deploy to Cloud Run:
gcloud projects add-iam-policy-binding pitchup-prod --member="serviceAccount:$PN@cloudbuild.gserviceaccount.com" --role=roles/run.admin
gcloud projects add-iam-policy-binding pitchup-prod --member="serviceAccount:$PN@cloudbuild.gserviceaccount.com" --role=roles/iam.serviceAccountUser
```

The Gemini key comes from https://aistudio.google.com/apikey (the browser voice call uses short-lived Gemini API tokens, which need a Gemini API key rather than Vertex AI credentials).

### 6. Build and deploy

```bash
gcloud builds submit --config cloudbuild.yaml
```

The container runs `prisma migrate deploy` on start (via `DIRECT_URL`). Seeding was done once in step 4.

### 7. Dodo Payments

Dodo is the merchant of record (handles cards, tax and payouts; individuals can sign up, payouts to Georgia are supported).

1. Sign up at https://app.dodopayments.com and verify your ID (needed for live payments and payouts; test mode works at once).
2. **Products → Create**: one-time, **Pay what you want**, currency **USD**, minimum $1, name "PitchUp". Copy its `pdt_...` id into `DODO_PRODUCT_ID`. The app sets the real price for every checkout (Pro $12 / $99, courses at their USD price).
3. **Developer → API keys**: copy the key into `DODO_PAYMENTS_API_KEY` (`dodo_test_...` uses test mode, `dodo_live_...` live).
4. **Developer → Webhooks**: add `https://YOUR_DOMAIN/api/dodo/webhook` with event `payment.succeeded`; copy the signing secret into `DODO_WEBHOOK_KEY`.
5. Keep **Adaptive Currency off**: the webhook only grants access for USD payments of at least the expected amount.

Pro is prepaid (1 month / 1 year per payment, no auto-renew). Course purchases are one-time.

### 8. Custom domain + HTTPS

```bash
gcloud beta run domain-mappings create --service=pitchup --domain=pitchup.ge --region=europe-west3
```

Add the DNS records it prints at your registrar. HTTPS certificates are issued automatically. Then update `APP_URL` and the Supabase redirect URLs.

## Admin

Emails listed in `ADMIN_EMAILS` become admins on login. Admin panel: `/ka/admin` — users (ban, role), payments + revenue, call logs, and CRUD for professions, courses, modules, lessons, quiz questions and AI scenarios (persona prompts in ka + en).
