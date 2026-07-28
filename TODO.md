# DriftLock MVP TODO

**Rule:** No features, refactoring, or scope creep until every MVP task is ✅. When tempted to add something, ask: "Is this in this list?" If no, defer to post-MVP.

---

## Story 1: Auto-Repair After Redesign (2.5–3.5h)

### Phase 1: Data Layer
- [ ] `backend/models/selector.py` — PostgreSQL schema for selectors, versions, change logs
- [ ] Database migrations (selector table with version history, change detection logs)

### Phase 2: Detection & Repair (Core Logic)
- [x] `backend/detection/site_monitor.py` — Detect website changes (JS bundle hash, DOM diffs, template shifts)
- [x] `backend/repair/selector_repair.py` — Repair broken selectors (backup keys, JSON-LD, reverse-search)
- [x] Unit tests for detection + repair (42 tests on 2 real sites: retail + job board)

### Phase 3: API
- [ ] `src/app/api/sites/detect/route.ts` — POST endpoint to trigger detection manually
  - Takes: `{siteUrl: string, selectorIds: string[]}`
  - Returns: `{detected: bool, repaired: {selectorId, oldSelector, newSelector}[]}`

### Phase 4: Integration
- [ ] Wire detection + repair into the detect endpoint
- [ ] Selector state model updates (store active version after repair)

**NOT in MVP:**
- ~~Background scheduler~~ (defer to post-MVP, manually trigger for demo)
- ~~Dashboard UI~~ (show JSON endpoint response instead)

---

## Story 2: Runtime Selector Retrieval (0.75–1h)

### Phase 1: Setup
- [ ] `src/lib/supabase.ts` — Supabase client (if not already done)
- [ ] `backend/models/selector_state.py` — Store selector state (active version, last repaired, fallbacks)

### Phase 2: API Endpoint
- [ ] `src/app/api/selectors/[selectorId]/current/route.ts` — GET endpoint returning active selector
  - Takes: `GET /api/selectors/{selectorId}/current`
  - Returns: `{selectorId, currentSelector, timestamp, lastRepaired}`

### Phase 3: Integration Demo
- [ ] `examples/scraper_integration.py` — Example scraper code calling the endpoint at runtime
- [ ] Test: Scraper pulls selector → site redesigns → scraper calls `/current` → gets repaired selector → keeps working

**NOT in MVP:**
- ~~Fallback endpoint~~ (defer to post-MVP)

---

## Live Demo Sequence

1. Start scraper pulling data from test site ✓
2. Manually trigger `POST /api/sites/detect` → detects redesign, repairs selector ✓
3. Scraper calls `GET /api/selectors/[id]/current` → gets repaired selector ✓
4. Scraper resumes with zero code change ✓

---

## Blockers / Known Risks
- [ ] Test sites must be live and redesign-ready (or use synthetic test data)
- [ ] Repair logic must handle at least 2 different site types (ecommerce + job board)
- [ ] API response time target: detection <2 min, repair <30 sec

---

## Post-MVP (Explicitly NOT in this sprint)
- Background scheduler (`backend/scheduler/monitor_loop.py`)
- Dashboard UI (`src/app/dashboard/page.tsx`)
- Fallback selector endpoint
- Version history UI
- Multi-site repair coverage testing

---

**Shipping deadline: 4 hours from start**
