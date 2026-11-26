# Dispatha migration starter

This is the first migration package for Dispatha. It is a React + Vite frontend using the existing Supabase schema and a Supabase Edge Function for privileged booking and provider-review actions.

## Included now
- Email/password sign-up and sign-in
- Customer/provider profile setup
- Provider application submission (profile data)
- Admin-only provider approval/rejection for `ddispatha@gmail.com`
- Customer booking creation
- Verified-provider booking acceptance and status updates
- Green/white responsive interface

## Important current limitations
- Provider verification document upload/selfie capture is not yet wired into this first package.
- Email SMTP confirmation configuration is still required in Supabase.
- Payments, escrow, wallet, live GPS, SMS, and app-store publishing are not included.
- This is a first functional migration build, not yet production-approved. Test with test accounts before inviting the public.
- The browser must only receive the Supabase publishable/anon key. Never put the service-role key in frontend code.

## Setup
1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Deploy `supabase/functions/dispatha-api` as a Supabase Edge Function named `dispatha-api`.
3. Set Edge Function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The service-role key belongs only in Supabase Function secrets, never in GitHub or the browser.
4. Install dependencies with `npm install`; run `npm run build`.
5. Deploy the `dist` folder using Cloudflare Pages. Set the two VITE_ environment variables in Cloudflare Pages build settings.

## Supabase function deployment
Using Supabase Dashboard: Edge Functions > Deploy a new function > `dispatha-api`, then paste `index.ts`. Add the three secrets in Edge Function Secrets.
