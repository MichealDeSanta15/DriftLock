# Phase 3 Integration Guide — API Endpoints (For Person 2)

**Status**: Phase 1 (Data Layer) ✅ and Phase 2 (Detection & Repair) ✅ ready
**Task**: Build API endpoints that wire Phase 1 + Phase 2 together

---

## What Person 2 Needs to Build

### 1. `POST /api/sites/detect`
Triggers detection and repair for a website and its broken selectors.

**Input**:
```json
{
  "siteUrl": "https://example.com/product/123",
  "selectorIds": ["sel_1", "sel_2", "sel_3"]
}
```

**Output**:
```json
{
  "detected": true,
  "confidence": 0.87,
  "changeType": "script_change",
  "repaired": [
    {
      "selectorId": "sel_1",
      "oldSelector": "h1.product-title",
      "newSelector": "h2.product-name",
      "method": "backup_selector",
      "confidence": 0.95,
      "success": true
    },
    {
      "selectorId": "sel_2",
      "oldSelector": "span.price",
      "newSelector": null,
      "method": "all_failed",
      "confidence": 0.0,
      "success": false
    }
  ]
}
```

### 2. `GET /api/selectors/[selectorId]/current`
Returns the current active selector for a selector ID.

**Input**: URL parameter `selectorId`

**Output**:
```json
{
  "selectorId": "sel_1",
  "currentSelector": "h2.product-name",
  "timestamp": "2025-07-28T15:30:00Z",
  "lastRepaired": "2025-07-28T14:15:00Z",
  "repairCount": 3,
  "confidence": 0.95
}
```

---

## Implementation Walkthrough

### Setup: Python Backend Access

First, enable calling Python from Node.js. Options:

**Option A: Child Process** (Simple)
```typescript
import { spawn } from "child_process";

const result = await runPython("repair_selector.py", {
  old_selector: "h1.title",
  old_html: oldHtml,
  new_html: newHtml,
});
```

**Option B: HTTP Bridge** (Recommended)
```bash
# Run Python FastAPI server
python -m pip install fastapi uvicorn
python backend/api.py  # Exposes /detect and /repair endpoints
```

**Option C: Direct Import** (Advanced)
- Use Node.js `child_process` to call Python
- Or use `node-python` bridge

Recommended: **Option B** for production. Set up a separate Python service.

---

## Step 1: Build the Detect Endpoint

### Pseudocode

```typescript
// src/app/api/sites/detect/route.ts

export async function POST(req: Request) {
  const { siteUrl, selectorIds } = await req.json();

  // 1. Call Python detection
  const detectionResult = await detectChanges(siteUrl);
  
  if (!detectionResult.detected) {
    return Response.json({
      detected: false,
      repaired: []
    });
  }

  // 2. Fetch old snapshots from DB
  const oldSnapshots = await db.getSnapshots(siteUrl);
  const oldHtml = oldSnapshots.pages[siteUrl];

  // 3. Fetch current HTML
  const newHtml = await fetch(siteUrl).then(r => r.text());

  // 4. For each selector, try to repair
  const repaired = [];
  for (const selectorId of selectorIds) {
    const selector = await db.getSelector(selectorId);
    const backups = await db.getBackupSelectors(selectorId);

    const repairResult = await repairSelector({
      old_selector: selector.selector_key,
      old_html: oldHtml,
      new_html: newHtml,
      backup_selectors: backups
    });

    repaired.push({
      selectorId,
      ...repairResult
    });

    // 5. Store in DB
    if (repairResult.success) {
      await db.updateSelector(selectorId, {
        selector_key: repairResult.new_selector,
        is_current: true
      });

      await db.addChangeLog({
        selector_id: selectorId,
        old_selector: repairResult.old_selector,
        new_selector: repairResult.new_selector,
        detection_method: detectionResult.change_type,
        repair_method: repairResult.method,
        repair_status: "success",
        validation_score: repairResult.confidence
      });
    }
  }

  // 6. Create new snapshot
  await db.saveSnapshot(siteUrl, detectionResult.details.current_script_hashes);

  return Response.json({
    detected: detectionResult.detected,
    confidence: detectionResult.confidence,
    changeType: detectionResult.change_type,
    repaired
  });
}
```

### Real Implementation (TypeScript + Supabase)

```typescript
// src/app/api/sites/detect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { detectChanges, repairSelector } from "@/lib/python-backend";

export async function POST(req: NextRequest) {
  try {
    const { siteUrl, selectorIds } = await req.json();

    const supabase = createClient();

    // 1. Get current snapshots
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("*")
      .eq("site_url", siteUrl)
      .order("created_at", { ascending: false })
      .limit(1);

    const oldSnapshot = snapshots?.[0]?.data;

    if (!oldSnapshot) {
      return NextResponse.json(
        { error: "No previous snapshot found. Run detection first." },
        { status: 400 }
      );
    }

    // 2. Detect changes
    const detectionResult = await detectChanges(
      siteUrl,
      oldSnapshot
    );

    if (!detectionResult.detected) {
      return NextResponse.json({
        detected: false,
        confidence: 0,
        repaired: [],
      });
    }

    // 3. Fetch new HTML
    const response = await fetch(siteUrl);
    const newHtml = await response.text();
    const oldHtml = oldSnapshot.pages[siteUrl];

    // 4. Repair each selector
    const repaired = [];
    for (const selectorId of selectorIds) {
      const { data: selector } = await supabase
        .from("selectors")
        .select("*")
        .eq("id", selectorId)
        .single();

      const { data: versions } = await supabase
        .from("selector_versions")
        .select("selector_value")
        .eq("selector_id", selectorId)
        .order("created_at", { ascending: false })
        .limit(3);

      const backupSelectors = versions
        ?.map((v) => v.selector_value)
        .filter((v) => v !== selector.selector_key) || [];

      const repairResult = await repairSelector({
        site_url: siteUrl,
        old_selector: selector.selector_key,
        old_html: oldHtml,
        new_html: newHtml,
        backup_selectors: backupSelectors,
      });

      repaired.push({
        selectorId,
        oldSelector: repairResult.old_selector,
        newSelector: repairResult.new_selector,
        method: repairResult.method,
        confidence: repairResult.confidence,
        success: repairResult.success,
      });

      // 5. Update database
      if (repairResult.success) {
        // Create new version
        await supabase.from("selector_versions").insert({
          selector_id: selectorId,
          selector_value: repairResult.new_selector,
          version_number: versions?.length || 1,
          is_backup: false,
          confidence_score: Math.round(repairResult.confidence * 100),
        });

        // Mark old as not current
        await supabase
          .from("selectors")
          .update({
            selector_key: repairResult.new_selector,
            is_current: true,
            repair_count: selector.repair_count + 1,
          })
          .eq("id", selectorId);

        // Log the change
        await supabase.from("change_logs").insert({
          selector_id: selectorId,
          old_selector: repairResult.old_selector,
          new_selector: repairResult.new_selector,
          detection_method: detectionResult.change_type,
          repair_method: repairResult.method,
          detection_timestamp: new Date().toISOString(),
          repair_timestamp: new Date().toISOString(),
          repair_status: "success",
          validation_score: Math.round(repairResult.confidence * 100),
        });
      } else {
        // Log failed repair
        await supabase.from("change_logs").insert({
          selector_id: selectorId,
          old_selector: repairResult.old_selector,
          new_selector: null,
          detection_method: detectionResult.change_type,
          repair_method: repairResult.method,
          detection_timestamp: new Date().toISOString(),
          repair_status: "failed",
          validation_score: 0,
        });
      }
    }

    // 6. Save new snapshot
    await supabase.from("snapshots").insert({
      site_url: siteUrl,
      data: {
        script_hashes: detectionResult.details.current_script_hashes,
        pages: { [siteUrl]: newHtml },
      },
    });

    return NextResponse.json({
      detected: true,
      confidence: detectionResult.confidence,
      changeType: detectionResult.change_type,
      repaired,
    });
  } catch (error) {
    console.error("Detection failed:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

---

## Step 2: Build the Current Selector Endpoint

```typescript
// src/app/api/selectors/[selectorId]/current/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { selectorId: string } }
) {
  try {
    const supabase = createClient();

    const { data: selector } = await supabase
      .from("selectors")
      .select("*")
      .eq("id", params.selectorId)
      .single();

    if (!selector) {
      return NextResponse.json(
        { error: "Selector not found" },
        { status: 404 }
      );
    }

    const { data: changeLogs } = await supabase
      .from("change_logs")
      .select("*")
      .eq("selector_id", params.selectorId)
      .eq("repair_status", "success")
      .order("repair_timestamp", { ascending: false })
      .limit(1);

    const lastRepair = changeLogs?.[0];

    return NextResponse.json({
      selectorId: params.selectorId,
      currentSelector: selector.selector_key,
      timestamp: selector.updated_at,
      lastRepaired: lastRepair?.repair_timestamp,
      repairCount: selector.repair_count,
      confidence: lastRepair ? lastRepair.validation_score / 100 : null,
    });
  } catch (error) {
    console.error("Error fetching selector:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

---

## Step 3: Connect Python Backend

### Option A: Via HTTP Bridge (FastAPI)

Create `backend/api.py`:

```python
from fastapi import FastAPI
from pydantic import BaseModel

from backend.detection import detect_changes, create_snapshot
from backend.repair import repair_selector

app = FastAPI()

class DetectRequest(BaseModel):
    site_url: str
    old_snapshot: dict = None

@app.post("/detect")
async def detect(req: DetectRequest):
    result = detect_changes(req.site_url, req.old_snapshot)
    return result.__dict__

class RepairRequest(BaseModel):
    site_url: str
    old_selector: str
    old_html: str
    new_html: str
    backup_selectors: list[str] = None

@app.post("/repair")
async def repair(req: RepairRequest):
    result = repair_selector(
        req.site_url,
        req.old_selector,
        req.old_html,
        req.new_html,
        req.backup_selectors
    )
    return result.__dict__

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Then in TypeScript:

```typescript
// lib/python-backend.ts

async function detectChanges(siteUrl: string, oldSnapshot?: any) {
  const response = await fetch("http://localhost:8000/detect", {
    method: "POST",
    body: JSON.stringify({ site_url: siteUrl, old_snapshot: oldSnapshot }),
  });
  return response.json();
}

async function repairSelector(params: any) {
  const response = await fetch("http://localhost:8000/repair", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return response.json();
}

export { detectChanges, repairSelector };
```

### Option B: Via Subprocess (Simpler but slower)

```typescript
// lib/python-backend.ts

import { spawn } from "child_process";

async function runPython(script: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python", [script, JSON.stringify(args)]);
    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(JSON.parse(output));
      } else {
        reject(new Error(`Python error: ${output}`));
      }
    });
  });
}

async function detectChanges(siteUrl: string, oldSnapshot?: any) {
  return runPython("backend/detect.py", {
    site_url: siteUrl,
    old_snapshot: oldSnapshot,
  });
}
```

---

## Database Schema Needed (Person 3)

Person 3 needs to create a `snapshots` table:

```sql
CREATE TABLE snapshots (
    id SERIAL PRIMARY KEY,
    site_url VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_snapshots_site ON snapshots(site_url);
```

This stores the snapshot returned by `create_snapshot()` for comparison next cycle.

---

## Testing the Integration

### Manual Test

```bash
# 1. Start Python backend
cd backend
python -m pip install fastapi uvicorn
python api.py
# Server running on localhost:8000

# 2. In another terminal, test endpoint
curl -X POST http://localhost:3000/api/sites/detect \
  -H "Content-Type: application/json" \
  -d '{
    "siteUrl": "https://example.com",
    "selectorIds": ["sel_1", "sel_2"]
  }'
```

### Automated Test

```typescript
// __tests__/api/sites/detect.test.ts

describe("POST /api/sites/detect", () => {
  it("detects changes and repairs selectors", async () => {
    // Setup: create test selectors in DB

    const response = await fetch("/api/sites/detect", {
      method: "POST",
      body: JSON.stringify({
        siteUrl: "https://test.example.com",
        selectorIds: ["test_sel_1"],
      }),
    });

    const data = await response.json();

    expect(data.detected).toBeDefined();
    expect(data.repaired).toBeInstanceOf(Array);
    expect(data.repaired[0]).toHaveProperty("success");
  });
});
```

---

## Key Points for Person 2

1. **Phase 1 Models**: Use `Selector`, `SelectorVersion`, `ChangeLog` from `backend.models`
   - Query active selectors: `WHERE is_current = true`
   - Store repair outcomes: Insert into `ChangeLog`

2. **Phase 2 APIs**:
   - `detect_changes(url, old_snapshot)` → DetectionResult
   - `repair_selector(...)` → RepairResult
   - Both are pure functions—no DB access

3. **Your Job**: Connect the pieces
   - Call Phase 2 functions
   - Read/write Phase 1 models
   - Return JSON to client

4. **Error Handling**:
   - No snapshot found? → 400 Bad Request
   - Repair failed? → Store with `repair_status="failed"`
   - HTTP fetch failed? → 500 Service Unavailable

5. **Performance**:
   - Detection: ~1 sec (network)
   - Repair: ~200ms per selector
   - Expected total: ~2-3 sec per request

---

## Checklist for Person 2

- [ ] Set up Python bridge (FastAPI or subprocess)
- [ ] Build `POST /api/sites/detect` endpoint
- [ ] Build `GET /api/selectors/[id]/current` endpoint
- [ ] Wire Phase 2 functions into endpoints
- [ ] Write results to Phase 1 database tables
- [ ] Test with mock selectors
- [ ] Test with real site (e.g., https://example.com)
- [ ] Handle errors gracefully
- [ ] Write integration tests

---

## Next: Demo

Once Phase 3 is complete:

```
1. Scraper pulls selector from GET /api/selectors/sel_1/current → gets "h1.title"
2. Scraper extracts data using selector → works
3. Site redesigns (you change HTML)
4. Scraper fails on next run
5. Trigger POST /api/sites/detect
6. API calls Phase 2 detection + repair
7. Database updated with new selector "h2.product-name"
8. Scraper calls GET /api/selectors/sel_1/current → gets new selector
9. Scraper resumes with zero code change ✓
```

That's the magic! 🎯
