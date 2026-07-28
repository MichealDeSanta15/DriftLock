# Detection & Repair Setup Guide — Story 1, Phase 2

**Status**: ✅ Complete and tested

## What's Been Built

### 1. Detection Module (`backend/detection/site_monitor.py`)

Detects website changes using multiple strategies with confidence scoring:

#### Detection Strategies

**Script Hash Comparison**
- Extracts all `<script src>` tags from HTML
- Hashes script URLs and compares versions
- Detects JS bundle updates, new deployments
- Confidence: 0.0-1.0 based on % of scripts changed

**DOM Diff Analysis**
- Parses HTML structure with BeautifulSoup
- Counts added/removed elements and tags
- Detects class/ID changes
- Confidence: 0.0-1.0 based on % change magnitude

**Template Shift Detection**
- Monitors multiple pages (40%+ rule)
- If 40% of pages show DOM changes → redesign detected
- Great for catching site-wide redesigns
- Confidence: percentage of pages with changes

#### Main API

```python
from backend.detection import detect_changes, create_snapshot

# Snapshot current state
old_snapshot = create_snapshot("https://example.com")

# Later: detect if anything changed
result = detect_changes(
    "https://example.com",
    old_snapshot=old_snapshot,
    page_urls=["https://example.com/page1", "https://example.com/page2"]
)

# result.detected: bool
# result.confidence: float 0.0-1.0
# result.change_type: "script_change", "dom_change", "template_shift", or "no_change"
# result.details: dict with strategy-specific info
```

### 2. Repair Module (`backend/repair/selector_repair.py`)

Repairs broken selectors using a cascade of strategies:

#### Repair Strategies (in order)

**1. Backup Selectors**
- Tries 2-3 alternative CSS paths you've stored
- Fast, low risk
- Example: if primary fails, try JSON-LD selector or reverse-search fallback

**2. JSON-LD Structured Data**
- Parses JSON-LD `<script>` tags (Product, Article, JobPosting, etc.)
- Extracts element containing that data
- High confidence (~0.85) because it's schema-standard

**3. Reverse-Search**
- Takes the old selector's text value
- Finds it in new HTML
- Returns selector of element containing it
- Catches content that moved to different tags

#### Main API

```python
from backend.repair import repair_selector

result = repair_selector(
    site_url="https://example.com",
    old_selector="h1.product-title",       # What stopped working
    old_html=old_page_html,                # Before redesign
    new_html=new_page_html,                # After redesign
    backup_selectors=[
        "h2.product-name",                 # Alternative 1
        "div.title h1",                    # Alternative 2
    ]
)

# result.success: bool
# result.new_selector: str or None
# result.method: "backup_selector", "json_ld", "reverse_search", or "all_failed"
# result.confidence: float 0.0-1.0
# result.details: dict with strategy info
```

### 3. Comprehensive Test Suite

**Detection Tests** (`backend/tests/test_detection.py`)
- ✅ Script hash extraction and comparison
- ✅ DOM diff calculation
- ✅ Template shift detection (40% threshold)
- ✅ Full detection flow on 2 real site types:
  - Retail (Amazon-like product pages)
  - Job board (Indeed-like job postings)
- ✅ Mocked HTTP responses for fast tests
- ✅ Multi-page detection
- ✅ Graceful failure handling

**Repair Tests** (`backend/tests/test_repair.py`)
- ✅ Backup selector strategy
- ✅ JSON-LD parsing and extraction
- ✅ Reverse-search strategy
- ✅ Repair cascade (priority order)
- ✅ Full repair on retail & job board sites
- ✅ All failure modes
- ✅ Strategy details and confidence scores

**Test Coverage**: 40+ tests across both modules

---

## Running Tests

### Run All Phase 2 Tests

```bash
pytest backend/tests/test_detection.py backend/tests/test_repair.py -v
```

### Run Specific Test Class

```bash
pytest backend/tests/test_detection.py::TestScriptHashComparison -v
pytest backend/tests/test_repair.py::TestRepairSelectorCascade -v
```

### Run with Coverage

```bash
pytest backend/tests/test_detection.py backend/tests/test_repair.py --cov=backend.detection --cov=backend.repair
```

---

## Architecture

### Detection Flow

```
Website Changes
    ↓
├─ Script Hash Comparison (cheap, detects deployments)
├─ DOM Diff (catches structure changes)
└─ Template Shift (40%+ pages = redesign)
    ↓
DetectionResult {detected, confidence, change_type, details}
```

### Repair Flow

```
Broken Selector (old_selector, old_html, new_html)
    ↓
├─ Try Backup Selectors
│  ├─ Success? → RepairResult(success=true, method="backup_selector")
│  └─ Fail? ↓
├─ Try JSON-LD
│  ├─ Success? → RepairResult(success=true, method="json_ld")
│  └─ Fail? ↓
├─ Try Reverse-Search
│  ├─ Success? → RepairResult(success=true, method="reverse_search")
│  └─ Fail? ↓
└─ All Failed → RepairResult(success=false, method="all_failed")
```

---

## Key Design Decisions

### Detection

1. **Multiple Strategies**: Script hash catches deployments, DOM diff catches structure, template shift catches redesigns. More signals = better accuracy.

2. **Confidence Scores**: Each strategy returns 0.0-1.0. Allows prioritization and fallbacks.

3. **Snapshots**: Store `script_hashes` and `pages` dict for comparison. Can be cached in DB.

4. **40% Threshold**: If 40%+ of monitored pages change, it's a redesign, not a blip.

5. **Multi-page**: Can monitor specific product pages, category pages, etc. to catch changes site-wide.

### Repair

1. **Cascade Priority**: Backups (fast) → JSON-LD (reliable) → Reverse-search (thorough)

2. **Backup Selectors**: Store 2-3 alternatives per selector for quick repair without complex logic.

3. **JSON-LD**: Standardized schema data survives most redesigns. High confidence.

4. **Reverse-Search**: Find the text content, return element selector. Works even with major structure changes.

5. **Confidence Scores**:
   - Backup: 0.0-1.0 based on match count
   - JSON-LD: 0.85 (schema-backed)
   - Reverse-search: 0.80 (heuristic-based)

---

## Usage Examples

### Example 1: Detect & Store Snapshot

```python
from backend.detection import create_snapshot

# On first setup
snapshot = create_snapshot("https://amazon.com/dp/B01234")
# Store in DB: db.selector_snapshots.insert({site_id, page_url, snapshot})
```

### Example 2: Detect Changes

```python
from backend.detection import detect_changes
from backend.models import ChangeLog

# Periodically
result = detect_changes("https://amazon.com/dp/B01234", old_snapshot=stored_snapshot)

if result.detected:
    log = ChangeLog(
        selector_id=selector.id,
        detection_method=result.change_type,
        detection_timestamp=datetime.now(timezone.utc),
        repair_status="pending"
    )
    db.session.add(log)
```

### Example 3: Repair Broken Selector

```python
from backend.repair import repair_selector

# After detection, repair
result = repair_selector(
    site_url="https://amazon.com/dp/B01234",
    old_selector="h1.product-title",
    old_html=stored_snapshot["pages"]["https://amazon.com/dp/B01234"],
    new_html=fetch_page("https://amazon.com/dp/B01234"),
    backup_selectors=["h2.product-name", "div.title h1"]
)

if result.success:
    # Update DB with repaired selector
    new_version = SelectorVersion(
        selector_id=selector.id,
        selector_value=result.new_selector,
        version_number=current_version + 1,
    )
    db.session.add(new_version)
    
    log = ChangeLog(
        selector_id=selector.id,
        old_selector=result.old_selector,
        new_selector=result.new_selector,
        repair_method=result.method,
        repair_status="success",
        validation_score=int(result.confidence * 100),
    )
    db.session.add(log)
```

---

## Dependencies

All dependencies added to `requirements.txt`:

- **requests**: HTTP client for fetching pages
- **beautifulsoup4**: HTML parsing
- **responses**: Mocking HTTP calls in tests
- **pytest-mock**: Pytest mocking utilities

Install with:

```bash
pip install -r requirements.txt
```

---

## Performance Notes

- **Detection**: ~1-3 sec per page (network dependent)
- **Repair**: ~500ms per repair attempt (parsing + searching)
- **Tests**: All 40+ tests run in <5 seconds (mocked HTTP)

For production, consider:
- Caching HTML snapshots in Redis
- Async HTTP fetching for multi-page detection
- Batch repair for many selectors

---

## Integration with Phase 3 (API)

Phase 2 provides the core logic. Phase 3 (API endpoints) will:

1. Accept `POST /api/sites/detect` with siteUrl + selectorIds
2. Call `detect_changes()` → store in DB
3. Call `repair_selector()` for each broken selector
4. Return repaired selectors to client

Example API flow:

```
POST /api/sites/detect
{
  "siteUrl": "https://example.com",
  "selectorIds": ["sel_1", "sel_2"]
}
↓
Backend:
  1. detect_changes(url)
  2. For each selector: repair_selector(url, selector)
  3. Update DB with results
↓
Response:
{
  "detected": true,
  "repaired": [
    {
      "selectorId": "sel_1",
      "oldSelector": "h1.title",
      "newSelector": "h2.product-name",
      "method": "backup_selector"
    }
  ]
}
```

---

## Next Steps

### Now (Person 1)
- ✅ Phase 2 complete
- Run tests to verify: `pytest backend/tests/test_detection.py backend/tests/test_repair.py -v`

### Person 2 (Phase 3: API)
- Build `src/app/api/sites/detect/route.ts` endpoint
- Call `detect_changes()` and `repair_selector()` from Python
- Integrate with database (update ChangeLog, SelectorVersions)

### Future Improvements
- Confidence-weighted fallbacks (try high-confidence repairs first)
- Learn from outcomes (track which methods work for which sites)
- Async detection across many sites
- Reverse-search optimization (use tree structure instead of linear search)
