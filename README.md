# rahulbk.com

> Personal site of **[Rahul Babu](https://rahulbk.com)** — patent-published AI inventor,
> founder of Laundroswipe (600+ users), Harvard HPAIR delegate. Building since age 8.

[![Live](https://img.shields.io/badge/live-rahulbk.com-d94414?style=for-the-badge&labelColor=0b0b0b)](https://rahulbk.com)
[![Cal](https://img.shields.io/badge/book%20a%20call-cal.com%2Frahulbabu-0b0b0b?style=for-the-badge)](https://cal.com/rahulbabu)
[![Stack](https://img.shields.io/badge/stack-static%20HTML%20%2B%20Vercel%20%2B%20Supabase-a2631f?style=for-the-badge&labelColor=0b0b0b)](#how-its-built)

![Rahul Babu — Builder · Patent-published AI Inventor](public/og.svg)

---

## What this is

Not a template. Every pixel is hand-authored.

The site doubles as a portfolio **and** a live demo — it runs a real AI-powered build
planner at [`/build-together`](https://rahulbk.com/build-together) so recruiters,
investors, and fellow builders can _experience_ the kind of product I ship instead of
reading about it.

Three audiences, one URL. The `?mode=` parameter swaps the hero, credentials, and
stack detail for **General / Recruiters / Investors**. Deep-linkable, SEO-indexed
separately, zero SPA overhead.

## What's clever about it

| | |
|---|---|
| **AI-powered build planner** | 5-question interactive quiz at `/build-together` that drafts a personalised 30-day build plan. Default path: deterministic client-side generator (zero cost, privacy-safe). Optional BYOK: paste your own API key for a real streamed response. |
| **Force-directed constellation** | Hero canvas is a physics-driven graph of 12 years of projects. Drag nodes, hover for details. Pure canvas — no WebGL, no dependencies, 60fps on mobile. |
| **Live contact form** | Server-validated, IP rate-limited (6/h), honeypotted, written to Supabase via service-role (anon key never touches browser). Optional Resend fan-out for email notifications. |
| **Short-URL redirects** | `rahulbk.com/calendar`, `/github`, `/linkedin`, `/book`, `/cv` all redirect cleanly via `vercel.json`. Every link is memorable. |
| **AEO / GEO optimised** | Robots allowlist for GPTBot, ClaudeBot, PerplexityBot, Google-Extended. Person + WebSite + ProfessionalService + FAQPage + BreadcrumbList JSON-LD for answer-engine surfacing. `llms.txt` shipped for AI crawler guidance. |
| **Konami egg → source** | Type `↑↑↓↓←→←→BA` anywhere on the page. |
| **Build-time PNGs** | `og.png`, `favicon-32.png`, `apple-touch-icon.png` regenerated from SVG source on every Vercel build via `sharp`. Git tracks only the SVGs. |

## How it's built

Pure static HTML + one Node serverless function. No framework, no bundler, no
hydration. First paint < 500ms on 4G.

```
.
├── public/                       STATIC ROOT — served as the website
│   ├── index.html                   Portfolio (three audience modes)
│   ├── build-together.html          AI-powered build planner
│   ├── thanks.html                  Contact form success page
│   ├── og.svg → og.png              Social preview, regenerated each build
│   ├── favicon.svg → *.png          Favicons, regenerated each build
│   ├── manifest.webmanifest         PWA-lite
│   ├── robots.txt / sitemap.xml     SEO
│   └── llms.txt                     AI crawler guidance (AEO/GEO)
├── api/
│   └── contact.js                POST → validate → rate-limit → Supabase → (optional) Resend
├── scripts/
│   └── build-og.mjs              sharp: SVG → PNG build step
├── supabase-schema.sql           `contact_messages` table + RLS + unread view
├── vercel.json                   Security headers, redirects, cache policy, short URLs
├── package.json                  Runtime: @supabase/supabase-js · Dev: sharp
└── .env.example
```

### Tech in one glance

- **Runtime** — Static HTML, vanilla JS, CSS custom properties. No React, no Next.
- **Host** — Vercel static + one Node.js 24 serverless function (`/api/contact`).
- **Database** — Supabase Postgres with RLS; all inserts route through the service-role-wrapped API.
- **Fonts** — Plus Jakarta Sans (body) · Instrument Serif (display) · JetBrains Mono (labels).
- **Motion** — Native `IntersectionObserver` scroll reveals. No animation library.
- **Build** — `sharp` resizes SVGs to PNGs during Vercel build. ~4s total.
- **Email** (optional) — Resend for fan-out when a message comes in.

### Performance budget

- HTML ~100 KB uncompressed → ~18 KB gzipped.
- Zero blocking JS. Fonts preconnected + swap.
- All animation uses `transform` and `opacity` only — no layout-triggering properties.
- `backdrop-blur` scoped to fixed elements only (nav, overlays). Never on scrolling content.
- Lighthouse target: 100 / 100 / 100 / 100.

---

# Complete Install Guide

If you're forking this or adapting it for your own portfolio, follow this end-to-end.

## Prerequisites

You need:

- **Node.js ≥ 20** — install from [nodejs.org](https://nodejs.org) or via `brew install node`
- **Git** — `brew install git` on macOS, or [git-scm.com](https://git-scm.com)
- **A GitHub account** — [github.com](https://github.com)
- **A Vercel account** — [vercel.com](https://vercel.com) (free Hobby plan is fine)
- **A Supabase account** — [supabase.com](https://supabase.com) (free tier is fine)
- **Vercel CLI** — `npm i -g vercel` (for local dev + one-off deploys)

Check your versions:

```bash
node -v       # should print v20.x or higher
git --version
vercel --version
```

## 1. Clone and install

```bash
git clone https://github.com/tuttucodes/rahulbk.com.git
cd rahulbk.com
npm install
```

`npm install` pulls two packages: `@supabase/supabase-js` (used by the contact API)
and `sharp` (used by the build-time PNG generator).

Run the build once to verify it works:

```bash
npm run build
```

You should see:

```
✓ public/og.png (1200×630)
✓ public/favicon-32.png (32×32)
✓ public/apple-touch-icon.png (180×180)
```

## 2. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick a name, choose a region close to you, generate a strong database password.
3. Wait ~2 minutes for the project to provision.
4. Open **SQL Editor** → **New query** → paste the full contents of [`supabase-schema.sql`](supabase-schema.sql) → **Run**.
5. Verify: **Table Editor** now shows a `contact_messages` table with RLS enabled.
6. Go to **Settings → API** and copy:
   - **Project URL** → you'll use this as `SUPABASE_URL`
   - **`service_role` key** (NOT anon) → you'll use this as `SUPABASE_SERVICE_ROLE_KEY`

> **Security note.** The `service_role` key bypasses RLS by design. It only ever runs
> inside `/api/contact.js` on Vercel's server — never shipped to the browser. The anon
> key is never used by this project because no client-side Supabase call exists.

## 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values from Supabase:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your_real_key

# Optional — skip these for MVP
CONTACT_NOTIFY_EMAIL=rahulbabuk05@gmail.com
RESEND_API_KEY=re_...
```

## 4. Run locally

```bash
npx vercel dev
```

First run links your local folder to a Vercel project — let it create one (or link to
an existing one). It then:

- Runs `npm run build` to generate PNGs.
- Serves `public/` at `http://localhost:3000`.
- Runs `api/contact.js` as a serverless function at `http://localhost:3000/api/contact`.

Open the site, fill out the contact form, hit **Send**. Go back to Supabase →
Table Editor → `contact_messages`. The row should be there.

**Troubleshooting:**

- **`vercel dev` recursion error** — remove any `"dev"` script in `package.json`.
- **Contact form returns 500** — your env vars aren't loaded. Confirm `.env.local` exists and is populated.
- **Contact form returns 429** — rate limit: 6 submissions/hour/IP. Works as designed.

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 6. Deploy to Vercel

### Option A — automatic (recommended)

1. Vercel dashboard → **Add New → Project** → import your GitHub repo.
2. Vercel detects `vercel.json` automatically. Leave framework preset as "Other".
3. **Environment Variables** — add the same two (or four) values from `.env.local`.
   Apply to **Production + Preview + Development**.
4. Click **Deploy**. Takes ~30 seconds.
5. Every future `git push` to `main` auto-deploys.

### Option B — CLI one-off

```bash
vercel --prod
```

## 7. Connect your custom domain

### In Vercel

- Project → **Settings → Domains** → add `yourdomain.com` and `www.yourdomain.com`.
- Vercel shows you the DNS records needed.

### In your DNS provider (Cloudflare example)

- `A` record on `@` → `76.76.21.21` — **proxy OFF** (Vercel issues the cert)
- `CNAME` on `www` → `cname.vercel-dns.com` — **proxy OFF**

Turn the Cloudflare proxy OFF (grey cloud) initially so Vercel can issue the SSL
certificate directly. Once the cert is active, you can turn the proxy back on if
you want Cloudflare caching in front.

Verify propagation at [dnschecker.org](https://dnschecker.org). Usually 5 minutes,
up to 24 hours worst case.

### Verify the full stack

```bash
# Homepage
curl -sI https://yourdomain.com/ | head -4

# Build planner (cleanUrls)
curl -sI https://yourdomain.com/build-together | head -4

# API endpoint — expect 405 on GET (POST only)
curl -sI https://yourdomain.com/api/contact | head -4

# Short URL redirect
curl -sI https://yourdomain.com/calendar | grep location
```

All should return `200` / `307` as appropriate.

---

# SEO / AEO / GEO submission guide

After deploy, submit the site to every search + answer engine. Typical time to first
indexing: 24–72 hours on Google, a week on Bing.

## 1. Google Search Console

1. Open [search.google.com/search-console](https://search.google.com/search-console).
2. **Add property** → **Domain** (enter `yourdomain.com` — works for both apex and www).
3. Verify via **DNS TXT record** in Cloudflare (copy the `google-site-verification=…` TXT value).
4. Once verified, go to **Sitemaps** → submit `https://yourdomain.com/sitemap.xml`.
5. Under **URL Inspection**, paste your homepage and click **Request Indexing**. Repeat
   for `/build-together`.

**Alternative verification via meta tag:** if you don't want a TXT record, Search
Console also accepts an HTML meta tag. The template already includes the placeholder
at the top of `public/index.html`:

```html
<meta name="google-site-verification" content="REPLACE_WITH_GOOGLE_TOKEN">
```

Paste the token Google gives you, commit, deploy, then hit Verify.

## 2. Bing Webmaster Tools

- [bing.com/webmasters](https://www.bing.com/webmasters) → **Add site**.
- Easy path: **Import from Google Search Console** (one-click copy of verified properties).
- Or verify via the `msvalidate.01` meta tag already placeholdered in `index.html`.
- Submit `sitemap.xml`.

Bing also powers DuckDuckGo, Yahoo, and ChatGPT's web browsing — submitting here hits
multiple surfaces at once.

## 3. Yandex Webmaster (optional, global reach)

- [webmaster.yandex.com](https://webmaster.yandex.com) → add site → verify via the
  `yandex-verification` meta tag already placeholdered.

## 4. IndexNow (Bing, Yandex, Naver — instant indexing)

Bing honours [IndexNow](https://www.indexnow.org), a push-based indexing protocol.
When you publish new content, ping:

```bash
curl "https://api.indexnow.org/indexnow?url=https://yourdomain.com/&key=YOUR_INDEXNOW_KEY"
```

Generate the key by placing a text file at `public/<random-hash>.txt` containing that
same hash, then pass it as the `key` query param. Bing picks up new URLs within hours.

## 5. AI answer engines — AEO / GEO

The robots allowlist in [`public/robots.txt`](public/robots.txt) already explicitly
welcomes:

- **GPTBot** (ChatGPT / OpenAI)
- **ClaudeBot** (Anthropic)
- **Google-Extended** (Google's AI training crawler)
- **PerplexityBot** (Perplexity)
- **Applebot-Extended** (Apple Intelligence)
- **CCBot** (Common Crawl — feeds most open-source LLMs)
- **cohere-ai**, **FacebookBot**, **Bytespider**, **ChatGPT-User**

Structured data that helps AI answer engines surface the right content:

- **Person** schema → enables Google Knowledge Panel
- **FAQPage** schema → powers "People also ask" + direct answer extraction
- **ProfessionalService** schema → links into local/service search
- **BreadcrumbList** → breadcrumb display in SERPs
- **WebSite** with `SearchAction` → enables sitelinks search box

All are already embedded in `<head>` of `index.html`.

A human-readable summary for AI crawlers lives at
[`public/llms.txt`](public/llms.txt) — follows the emerging [llmstxt.org](https://llmstxt.org)
spec. Edit it whenever your key facts change.

## 6. Social + directory submissions

- **LinkedIn** — add `yourdomain.com` to your LinkedIn profile's _Contact info_. LinkedIn
  now shows AI-detected skills and links in searches.
- **GitHub profile README** — pin this repo. Recruiters browsing your GitHub will see it first.
- **Product Hunt / Hacker News / Indie Hackers** — submit the AI build planner page
  (`/build-together`) as its own standalone tool. Backlinks from those properties
  have unusually high domain authority.
- **X / Twitter** — drop the link with the OG preview attached. The `twitter:card`
  meta is set to `summary_large_image`, so it renders the full OG card.

## 7. Track and iterate

- **Vercel Analytics** — one click in the Vercel dashboard. Free on Hobby plan.
- **Google Search Console** — check **Performance** weekly for query rankings.
- **Ahrefs Webmaster Tools** (free) — submit the site to track backlinks.

Expect 2–4 weeks for meaningful organic traffic. Search for **"Rahul Babu"** weekly —
if the site isn't on page 1 after a month, add two or three press mentions or
directory listings to juice the domain authority.

---

# Moderation

```sql
-- Unread inbox
select * from contact_messages_unread;

-- Mark handled
update contact_messages set handled = true where id = '<uuid>';

-- Purge obvious spam older than 30 days
delete from contact_messages
where created_at < now() - interval '30 days'
and message ~* '(crypto|bitcoin|seo expert|guest post)';
```

# License

UNLICENSED. Source is public so you can poke around and learn from it. Please don't
scrape the content or re-use the design wholesale — if you like something, ask.

# Who

**Rahul Babu** — [rahulbk.com](https://rahulbk.com) ·
[cal.com/rahulbabu](https://cal.com/rahulbabu) ·
[github.com/tuttucodes](https://github.com/tuttucodes) ·
[rahulbabuk05@gmail.com](mailto:rahulbabuk05@gmail.com)

If you're building something interesting, say hi.
