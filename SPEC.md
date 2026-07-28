# DriftLock Spec

## Project name
DriftLock — Scrapers break silently when websites redesign. We fix that.

## Problem
Data teams run web scrapers to pull business-critical data from competitor sites, property listings, job boards, and reseller platforms. But every website redesign breaks scrapers silently — the data is still on the page, but the selectors pointing to it no longer work. Teams either babysit scrapers constantly, or discover corrupted data weeks after it entered the pipeline. There's no API, no feed, and no way to know when a page breaks without monitoring every single scraper.

## Core flow
1. Customer connects their scraper to DriftLock API instead of hardcoding selectors
2. Scraper requests current selector key at runtime
3. Website redesigns or deploys
4. DriftLock detects the change (JS bundle hash, template shifts, etc.)
5. DriftLock automatically repairs the selector using backup keys, JSON-LD, or reverse-search
6. Scraper continues working without code change, incident, or downtime

## Stack
Next.js + Supabase / Python backend + SQLite / PostgreSQL for selector versioning and outcome tracking

## Done =
- Scraper stays working after a live site redesign with zero customer intervention
- Demo shows detection within 2 minutes of a site change, repair in under 30 seconds
- Customer can pull a fresh selector key via API and scraper resumes without touching code
- Selector repair works on at least 10 test sites (retail, real estate, job boards, pricing pages)

---

**Fill every bracket before you code.** A vague spec produces a vague product.
