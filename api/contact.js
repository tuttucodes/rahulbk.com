// ================================================================
//  POST /api/contact
//  Vercel Node serverless function.
//  Validates the contact form payload, rate-limits by IP, and
//  inserts into the Supabase `contact_messages` table using the
//  service-role key. Service-role key stays server-side — never
//  shipped to the browser.
//
//  Env vars (set in Vercel dashboard + local .env):
//    SUPABASE_URL                   https://<project>.supabase.co
//    SUPABASE_SERVICE_ROLE_KEY      eyJ... (service_role, not anon)
//    CONTACT_NOTIFY_EMAIL           rahulbabuk05@gmail.com (optional)
//    RESEND_API_KEY                 re_... (optional, for email fan-out)
// ================================================================

import { createClient } from '@supabase/supabase-js';

// In-memory token bucket (per lambda instance). Good enough for a
// portfolio — for higher traffic, swap for Upstash Redis or a DB check.
const BUCKETS = new Map();
const MAX_PER_HOUR = 6;

function rateLimit(ip) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const hits = (BUCKETS.get(ip) || []).filter((t) => t > hourAgo);
  if (hits.length >= MAX_PER_HOUR) return false;
  hits.push(now);
  BUCKETS.set(ip, hits);
  return true;
}

function clientIP(req) {
  const xff = (req.headers['x-forwarded-for'] || '').toString();
  return xff.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function sanitize(s, max) { return (s || '').toString().trim().slice(0, max); }

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = clientIP(req);
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Too many requests — try again in an hour.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid payload' });

  // Honeypot
  if (body.website) return res.status(200).json({ ok: true });

  const name = sanitize(body.name, 120);
  const email = sanitize(body.email, 180);
  const company = sanitize(body.company, 180);
  const message = sanitize(body.message, 4000);

  if (name.length < 2) return res.status(400).json({ error: 'Name too short.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Invalid email.' });
  if (message.length < 10) return res.status(400).json({ error: 'Message too short.' });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Supabase env vars missing');
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const userAgent = (req.headers['user-agent'] || '').toString().slice(0, 500);
  const referer = (req.headers['referer'] || '').toString().slice(0, 500);

  const { error } = await supabase.from('contact_messages').insert({
    name, email, company: company || null, message,
    ip, user_agent: userAgent, referer,
  });

  if (error) {
    console.error('Supabase insert failed:', error);
    return res.status(500).json({ error: 'Could not save message.' });
  }

  // Optional fan-out email via Resend. Silent no-op if RESEND_API_KEY is absent.
  const resendKey = process.env.RESEND_API_KEY;
  const notify = process.env.CONTACT_NOTIFY_EMAIL || 'rahulbabuk05@gmail.com';
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Rahul Babu <hello@rahulbk.com>',
          to: notify,
          reply_to: email,
          subject: `New message from ${name}${company ? ' · ' + company : ''}`,
          text:
            `From: ${name} <${email}>\n` +
            (company ? `Company: ${company}\n` : '') +
            `IP: ${ip}\n---\n\n${message}`,
        }),
      });
    } catch (e) {
      console.error('Resend fan-out failed (non-fatal):', e);
    }
  }

  return res.status(200).json({ ok: true });
}
