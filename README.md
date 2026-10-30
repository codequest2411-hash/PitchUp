# PitchUp (პიჩაპი)

Learn to sell by talking to an AI customer. Pick a profession, call a realistic AI customer (voice or text), handle objections, close — and get scored on 6 skills. Levels, XP, badges, free + paid courses, Georgian + English.

**Stack:** Next.js 15 (App Router) · Tailwind 4 · next-intl (`/ka`, `/en`) · Prisma + Supabase (PostgreSQL) · Firebase Auth (Google + email) · Gemini Live (voice) + Gemini (text, scoring) · Stripe · Cloud Run.

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
| Firebase | Login page shows **"Log in as demo student / demo admin"** (dev only, never in production) |
| `GEMINI_API_KEY` | Calls run in text mode with canned customer replies; scoring uses a simple heuristic |
| Stripe | Buy buttons show "not configured" |

Tests: `npm test`

## Project map

| Path | What |
|---|---|
| `prisma/schema.prisma`, `prisma/seed.ts` | Data model and seed content |
| `messages/ka.json`, `messages/en.json` | All UI text |
| `src/app/[locale]/…` | Pages (landing, courses, practice, call, results, dashboard, admin…) |
| `src/app/api/…` | Auth session, calls, checkout, Stripe webhook, data export |
| `src/lib/ai.ts` | Persona prompt, text replies, scoring, Live ephemeral token |
| `src/lib/live-voice.ts` | Browser mic ↔ Gemini Live audio streaming |
| `src/lib/levels.ts` | XP / level / streak rules |
| `src/lib/access.ts` | Plan checks, daily call limits, max call length |
| `src/lib/payments.ts` | All Stripe code (swap in BOG / TBC Pay here) |
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

### 2. Firebase Authentication

1. Go to https://console.firebase.google.com → **Add project** → choose the existing `pitchup-prod`.
2. **Build → Authentication → Sign-in method**: enable **Google** and **Email/Password**.
3. **Authentication → Settings → Authorized domains**: add `localhost`, your Cloud Run URL (`pitchup-xxxx.a.run.app`) and your domain.
4. **Project settings → General → Your apps → Web app**: copy `apiKey`, `authDomain`, `projectId`, `appId` into `env.cloudrun.yaml` (copy from `env.cloudrun.example.yaml`).
5. **Project settings → Service accounts → Generate new private key**: you'll store this JSON as a secret in step 5.

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

The app reaches Supabase only through Prisma on the server; Supabase Auth/Storage are not used (auth is Firebase), and the browser never connects to the database.

### 5. Secrets

```bash
printf '%s' 'SUPABASE_POOLED_URL_6543' | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' 'SUPABASE_DIRECT_URL_5432' | gcloud secrets create DIRECT_URL --data-file=-
gcloud secrets create FIREBASE_SERVICE_ACCOUNT --data-file=service-account.json
printf '%s' 'sk_live_or_test_...' | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
printf '%s' 'whsec_...'           | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
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

### 7. Stripe webhook

Stripe Dashboard → Developers → Webhooks → add endpoint `https://YOUR_DOMAIN/api/stripe/webhook` with events:
`checkout.session.completed`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
Put the signing secret into `STRIPE_WEBHOOK_SECRET`. Also enable the **Customer portal** (Settings → Billing → Customer portal).

Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, test card `4242 4242 4242 4242`.

### 8. Custom domain + HTTPS

```bash
gcloud beta run domain-mappings create --service=pitchup --domain=pitchup.ge --region=europe-west3
```

Add the DNS records it prints at your registrar. HTTPS certificates are issued automatically. Then update `APP_URL`, Firebase authorized domains and the Stripe webhook URL.

## Admin

Emails listed in `ADMIN_EMAILS` become admins on login. Admin panel: `/ka/admin` — users (ban, role), payments + revenue, call logs, and CRUD for professions, courses, modules, lessons, quiz questions and AI scenarios (persona prompts in ka + en).
