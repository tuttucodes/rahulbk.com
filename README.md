# rahulbk.com

Personal site of Rahul Babu. Static HTML + a single Vercel serverless
function for the contact form. No framework, no build ceremony.

## What's here

```
.
├── public/                        STATIC ROOT — served as the website
│   ├── index.html                 Portfolio: general / recruiters / investors modes
│   ├── build-together.html        AI-powered build planner (5-question quiz)
│   ├── thanks.html                Contact form success page
│   ├── og.svg → og.png            Social preview (1200×630) — PNG generated at build
│   ├── favicon.svg → *.png        Favicon master — resized at build
│   ├── manifest.webmanifest       PWA-lite
│   ├── robots.txt / sitemap.xml   SEO
├── api/
│   └── contact.js                 POST → validates + rate-limits + writes to Supabase
├── scripts/
│   └── build-og.mjs               Generates og.png / favicons from SVG at build
├── supabase-schema.sql            Run once in the Supabase SQL editor
├── vercel.json                    Headers, redirects, short URLs
├── package.json                   Runtime: @supabase/supabase-js — Dev: sharp
├── .env.example                   Template for Supabase + email env vars
├── .vercelignore / .gitignore
└── README.md
```

## First-time setup

### 1 — Supabase

1. Create a new project at <https://supabase.com>.
2. Open the SQL editor, paste the contents of [supabase-schema.sql](supabase-schema.sql), run it.
3. Settings → API → copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` key** → `SUPABASE_SERVICE_ROLE_KEY`
     (NOT the anon key — service role bypasses RLS on the `contact_messages` table,
     which is correct because inserts only happen server-side through `/api/contact.js`.)

### 2 — Local env

```bash
cp .env.example .env.local
# paste the two values from Supabase into .env.local
```

### 3 — Install + run

```bash
npm install
npx vercel dev     # local preview at http://localhost:3000
```

Submit the contact form — the row should appear in Supabase → Table Editor → `contact_messages`.

### 4 — Deploy

Vercel is already connected. Push to `main` and Vercel auto-deploys.

```bash
git add .
git commit -m "ship: portfolio + AI planner + contact form"
git push origin main
```

On the Vercel dashboard, set the same env vars under
**Settings → Environment Variables** (apply to Production + Preview + Development).

### 5 — Domain (Cloudflare DNS → Vercel)

1. In Vercel: **Settings → Domains → Add `rahulbk.com`** and `www.rahulbk.com`.
2. Vercel will show you the DNS records needed. Typically:
   - `A` record on `@` → `76.76.21.21`
   - `CNAME` on `www` → `cname.vercel-dns.com`
3. Add those in Cloudflare → DNS. **Turn the proxy (orange cloud) OFF** for both records —
   Vercel needs to issue the SSL certificate directly. Once issued, you can turn the proxy
   back on if you want Cloudflare caching in front of Vercel (usually not worth it —
   Vercel's edge is already fast).
4. Verify at <https://dnschecker.org>. Allow up to 24 h to propagate, usually 5 min.

### 6 — Optional email notifications

Add `RESEND_API_KEY` (from <https://resend.com>) to Vercel env vars. Every contact form
submission will then email `rahulbabuk05@gmail.com` in addition to being saved in Supabase.
Skip this — and the form still works, silently saving to the DB.

## Moderation

Check new messages with:

```sql
select * from contact_messages_unread;
```

Mark handled:

```sql
update contact_messages set handled = true where id = '<uuid>';
```

Purge spam older than 30 days:

```sql
delete from contact_messages
where created_at < now() - interval '30 days'
and message ~* '(crypto|bitcoin|seo expert|guest post)';
```

## AI-powered build planner (/build-together)

Free by default — uses a client-side deterministic generator keyed on the visitor's
answers. Zero API cost, zero server hit. Visitors can optionally paste their own
Anthropic API key to see a real streamed Claude Sonnet response; the key is stored
only in their browser's localStorage, never leaves their device, and bills only
their account. No infra cost here either.

## Performance budget

- Lighthouse: 100 / 100 / 100 / 100 target.
- No runtime JS frameworks. No hydration. No build-time JS bundling.
- Fonts preconnected + variable font files. First paint < 500ms on 4G.
- Images: SVG for logos and OG base; PNG only for og.png + favicon sizes, generated at build.

## Known follow-ups

- Live case study page for Laundroswipe (currently sectioned inside index.html).
- `/og/[slug]` dynamic OG variants for deep-linked case studies — only if case study
  pages ship.

## License

UNLICENSED. Source is public so recruiters can poke around but don't copy-paste the
content without asking.

— Rahul
