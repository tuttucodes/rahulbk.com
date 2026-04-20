#!/usr/bin/env node
// =============================================================
//  IndexNow submitter for rahulbk.com
//  Protocol spec: https://www.indexnow.org/documentation
//
//  What this does
//  --------------
//  1. Reads all <loc> URLs from public/sitemap.xml.
//  2. POSTs them to the IndexNow endpoint in a single bulk payload.
//     Bing, Yandex, Naver, Seznam, Yep all accept from api.indexnow.org.
//  3. Prints the HTTP response code with a human-friendly reading.
//
//  When to run
//  -----------
//  After any content change goes live:
//    npm run submit
//
//  Response codes
//  --------------
//    200 OK                       — URLs accepted and crawl queued
//    202 Accepted                 — URLs accepted, key validation pending
//    400 Bad Request              — payload malformed
//    403 Forbidden                — key invalid / not at keyLocation
//    422 Unprocessable entity     — URL and key host don't match
//    429 Too Many Requests        — back off and retry
// =============================================================

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const HOST = process.env.INDEXNOW_HOST || 'rahulbk.com';
const KEY = process.env.INDEXNOW_KEY || '8b9d62373913e61f567f866065f68f33bd98f7d9600627b4';
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION || `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function readUrlsFromSitemap() {
  const xml = await readFile(resolve(root, 'public/sitemap.xml'), 'utf8');
  const matches = Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g));
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

function readingFor(status) {
  const map = {
    200: 'OK — crawlers queued',
    202: 'Accepted — key validation pending',
    400: 'Bad Request — payload malformed',
    403: 'Forbidden — key invalid or not reachable at keyLocation',
    422: 'Unprocessable entity — URL host mismatch with key',
    429: 'Too Many Requests — back off and retry later',
  };
  return map[status] || 'Unknown — check IndexNow docs';
}

async function main() {
  const urlList = await readUrlsFromSitemap();
  if (urlList.length === 0) {
    console.error('No URLs found in public/sitemap.xml');
    process.exit(1);
  }

  // Sanity check: confirm the key file resolves publicly. Soft warning, not fatal.
  try {
    const res = await fetch(KEY_LOCATION, { method: 'GET' });
    const body = res.ok ? (await res.text()).trim() : '';
    if (!res.ok) {
      console.warn(`⚠ Key file ${KEY_LOCATION} returned ${res.status}. IndexNow will reject with 403.`);
    } else if (body !== KEY) {
      console.warn(`⚠ Key file contents at ${KEY_LOCATION} don't match. Expected "${KEY}", got "${body.slice(0, 40)}...".`);
    } else {
      console.log(`✓ Key file verified at ${KEY_LOCATION}`);
    }
  } catch (e) {
    console.warn(`⚠ Could not verify key file (network?): ${e.message}`);
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  console.log(`→ Submitting ${urlList.length} URL${urlList.length === 1 ? '' : 's'} to IndexNow`);
  for (const u of urlList) console.log(`  · ${u}`);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const bodyText = await res.text().catch(() => '');
  console.log(`\n← ${res.status} ${res.statusText || ''} — ${readingFor(res.status)}`);
  if (bodyText) console.log(bodyText);

  if (!res.ok && res.status !== 202) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
