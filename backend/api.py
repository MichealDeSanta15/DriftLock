"""FastAPI bridge for detection and repair logic.

Exposes the Python backend functions as HTTP endpoints that Next.js can call.

Usage:
    python -m pip install fastapi uvicorn
    python -m uvicorn backend.api:app --host 0.0.0.0 --port 8000

Server will run on http://localhost:8000

Endpoints:
    GET /health - Health check
    GET /api/sites - Get all sites
    POST /api/sites - Create a new site
    PUT /api/sites/{site_id} - Update a site
    DELETE /api/sites/{site_id} - Delete a site
    POST /api/sites/detect - Detect website changes
    GET /api/selectors/{selector_id}/current - Get current selector
    POST /detect - Detect website changes (legacy)
    POST /repair - Repair broken selector (legacy)
    POST /snapshot - Create website snapshot (legacy)
"""

import logging
import os
import sys
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .detection import detect_changes, create_snapshot, diff_selectors
from .detection.site_monitor import fetch_page
from .models.base import utc_now
from .models.detection_event import DetectionEvent
from .models.repair_outcome import RepairOutcome
from .models.selector import Selector
from .models.site import Site
from .repair import repair_selector

# TODO: replace with the authenticated user's ID once auth is wired up.
PLACEHOLDER_OWNER_ID = "user-placeholder"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DriftLock Backend API",
    description="Detection and repair bridge for Next.js frontend",
    version="0.1.0",
)

# Enable CORS for Next.js. FRONTEND_URL should be set to the deployed
# Vercel URL in production; defaults keep local dev working.
_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_frontend_url = os.environ.get("FRONTEND_URL")
_allow_origins = _default_origins + [_frontend_url] if _frontend_url else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DetectRequest(BaseModel):
    """Request body for detection."""

    site_url: str
    old_snapshot: Optional[dict] = None
    page_urls: Optional[list[str]] = None


class DetectResponse(BaseModel):
    """Response from detection."""

    detected: bool
    confidence: float
    change_type: str
    details: Optional[dict] = None


class SnapshotRequest(BaseModel):
    """Request body for snapshot creation."""

    site_url: str
    page_urls: Optional[list[str]] = None


class SnapshotResponse(BaseModel):
    """Response from snapshot creation."""

    script_hashes: dict[str, str]
    pages: dict[str, str]


class RepairRequest(BaseModel):
    """Request body for selector repair."""

    site_url: str
    old_selector: str
    old_html: str
    new_html: str
    backup_selectors: Optional[list[str]] = None


class RepairResponse(BaseModel):
    """Response from repair."""

    success: bool
    old_selector: Optional[str]
    new_selector: Optional[str]
    method: str
    confidence: float
    details: Optional[dict] = None


class SiteResponse(BaseModel):
    """Response for a site."""

    id: str
    name: str
    url: str
    status: str = "working"
    lastChecked: str
    selectorId: str
    currentSelector: str
    lastRepaired: Optional[str] = None


class CreateSiteRequest(BaseModel):
    """Request to create or update a site."""

    name: str
    url: str
    selector: Optional[str] = None


class SitesListResponse(BaseModel):
    """Response for sites list."""

    sites: list[SiteResponse]


class DetectAPIRequest(BaseModel):
    """Request to trigger detection on a site."""

    site_id: str
    selector_id: Optional[str] = None


@app.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest) -> DetectResponse:
    """Detect website changes.

    Args:
        req: Detection request with site URL and optional old snapshot

    Returns:
        Detection result with change type and confidence

    Raises:
        HTTPException: If detection fails
    """
    try:
        logger.info(f"Detection request for {req.site_url}")

        result = detect_changes(
            site_url=req.site_url,
            old_snapshot=req.old_snapshot,
            page_urls=req.page_urls,
        )

        logger.info(
            f"Detection completed: detected={result.detected}, "
            f"confidence={result.confidence:.2%}, change_type={result.change_type}"
        )

        return DetectResponse(
            detected=result.detected,
            confidence=result.confidence,
            change_type=result.change_type,
            details=result.details,
        )

    except Exception as e:
        logger.error(f"Detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/snapshot", response_model=SnapshotResponse)
async def snapshot(req: SnapshotRequest) -> SnapshotResponse:
    """Create a website snapshot.

    Args:
        req: Snapshot request with site URL and optional page URLs

    Returns:
        Snapshot with script hashes and page content

    Raises:
        HTTPException: If snapshot creation fails
    """
    try:
        logger.info(f"Snapshot request for {req.site_url}")

        snapshot_data = create_snapshot(
            site_url=req.site_url,
            page_urls=req.page_urls,
        )

        logger.info(
            f"Snapshot created: {len(snapshot_data['script_hashes'])} scripts, "
            f"{len(snapshot_data['pages'])} pages"
        )

        return SnapshotResponse(
            script_hashes=snapshot_data["script_hashes"],
            pages=snapshot_data["pages"],
        )

    except Exception as e:
        logger.error(f"Snapshot creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/repair", response_model=RepairResponse)
async def repair(req: RepairRequest) -> RepairResponse:
    """Repair a broken selector.

    Args:
        req: Repair request with selector and HTML

    Returns:
        Repair result with new selector and method used

    Raises:
        HTTPException: If repair fails
    """
    try:
        logger.info(f"Repair request for {req.old_selector} on {req.site_url}")

        result = repair_selector(
            site_url=req.site_url,
            old_selector=req.old_selector,
            old_html=req.old_html,
            new_html=req.new_html,
            backup_selectors=req.backup_selectors,
        )

        logger.info(
            f"Repair completed: success={result.success}, "
            f"method={result.method}, confidence={result.confidence:.2%}"
        )

        return RepairResponse(
            success=result.success,
            old_selector=result.old_selector,
            new_selector=result.new_selector,
            method=result.method,
            confidence=result.confidence,
            details=result.details,
        )

    except Exception as e:
        logger.error(f"Repair failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "driftlock-backend"}


def _site_to_response(site: Site) -> SiteResponse:
    """Build a SiteResponse from a Site ORM row, using its current selector if any."""
    current_selector = next(
        (s for s in site.selectors if s.is_current), site.selectors[0] if site.selectors else None
    )

    status = "working"
    if current_selector is not None and current_selector.repair_status == "failed":
        status = "failed"
    elif current_selector is not None and current_selector.repair_status == "broken":
        status = "broken"

    return SiteResponse(
        id=site.id,
        name=site.name,
        url=site.url,
        status=status,
        lastChecked=site.updated_at.isoformat(),
        selectorId=current_selector.id if current_selector else "unknown",
        currentSelector=current_selector.selector_key if current_selector else "Not set",
        lastRepaired=(
            current_selector.last_repaired_at.isoformat()
            if current_selector and current_selector.last_repaired_at
            else None
        ),
    )


@app.get("/api/sites", response_model=SitesListResponse)
async def get_sites(db: Session = Depends(get_db)):
    """Get all active sites.

    Returns:
        List of sites with their status and selector information
    """
    try:
        logger.info("GET /api/sites - Fetching all sites")
        sites = (
            db.query(Site)
            .filter(Site.is_active.is_(True))
            .order_by(Site.updated_at.desc())
            .all()
        )
        return SitesListResponse(sites=[_site_to_response(site) for site in sites])
    except Exception as e:
        logger.error(f"Failed to fetch sites: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sites", response_model=SiteResponse)
async def create_site(req: CreateSiteRequest, db: Session = Depends(get_db)):
    """Create a new site.

    Args:
        req: Site creation request with name and URL

    Returns:
        Created site with ID and default status
    """
    try:
        logger.info(f"POST /api/sites - Creating site: {req.name}")
        site = Site(name=req.name, url=req.url, owner_id=PLACEHOLDER_OWNER_ID)
        db.add(site)
        db.flush()

        if req.selector:
            selector = Selector(site_id=site.id, selector_key=req.selector, is_current=True)
            db.add(selector)

        db.commit()
        db.refresh(site)
        return _site_to_response(site)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create site: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sites/{site_id}")
async def delete_site(site_id: str = Path(...), db: Session = Depends(get_db)):
    """Delete a site.

    Args:
        site_id: The site ID to delete

    Returns:
        Success message
    """
    try:
        logger.info(f"DELETE /api/sites/{site_id} - Deleting site")
        site = db.query(Site).filter(Site.id == site_id).first()
        if site is None:
            raise HTTPException(status_code=404, detail=f"Site {site_id} not found")

        site.is_active = False
        db.commit()
        return {"success": True, "message": f"Site {site_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete site {site_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sites/{site_id}", response_model=SiteResponse)
async def update_site(req: CreateSiteRequest, site_id: str = Path(...), db: Session = Depends(get_db)):
    """Update a site's name and URL.

    Args:
        site_id: The site ID to update
        req: New name and URL

    Returns:
        Updated site
    """
    try:
        logger.info(f"PUT /api/sites/{site_id} - Updating site")
        site = db.query(Site).filter(Site.id == site_id).first()
        if site is None:
            raise HTTPException(status_code=404, detail=f"Site {site_id} not found")

        site.name = req.name
        site.url = req.url
        db.commit()
        db.refresh(site)
        return _site_to_response(site)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update site {site_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sites/detect")
async def detect_site_changes(req: DetectAPIRequest, db: Session = Depends(get_db)):
    """Run detection (and repair, if a change is found) for a site.

    On the first call for a site there is no baseline snapshot yet, so this
    just captures one and returns detected=False. Subsequent calls compare
    against the stored baseline, and on detecting a change, attempt to
    repair the site's current selector.

    Args:
        req: Detection request with site_id

    Returns:
        Detection result, including any repair outcome
    """
    logger.info(f"POST /api/sites/detect - Triggering detection for site {req.site_id}")

    site = db.query(Site).filter(Site.id == req.site_id).first()
    if site is None:
        raise HTTPException(status_code=404, detail=f"Site {req.site_id} not found")

    selector = next((s for s in site.selectors if s.is_current), None)

    try:
        if not site.snapshot_pages:
            logger.info(f"No baseline snapshot for site {site.id}, creating one")
            snapshot = create_snapshot(site.url)
            site.snapshot_hashes = snapshot["script_hashes"]
            site.snapshot_pages = snapshot["pages"]
            db.commit()

            return {
                "site_id": site.id,
                "detected_at": utc_now().isoformat(),
                "signal_type": "no_baseline",
                "confidence": 0.0,
                "detected": False,
                "metadata": {"repaired": []},
            }

        old_snapshot = {
            "script_hashes": site.snapshot_hashes or {},
            "pages": site.snapshot_pages or {},
        }
        result = detect_changes(site.url, old_snapshot)

        db.add(
            DetectionEvent(
                site_id=site.id,
                selector_id=selector.id if selector else None,
                signal_type=result.change_type,
                confidence=round(result.confidence * 100),
            )
        )

        repaired: list[dict] = []
        changes: list[dict] = []

        if result.detected:
            new_html = fetch_page(site.url)
            old_html = old_snapshot["pages"].get(site.url)

            if new_html and old_html:
                # Auto-discover which element(s) changed, independent of
                # whether a selector was ever configured for this site.
                changes = diff_selectors(old_html, new_html)

                if selector is not None:
                    repair_result = repair_selector(
                        site_url=site.url,
                        old_selector=selector.selector_key,
                        old_html=old_html,
                        new_html=new_html,
                    )

                    db.add(
                        RepairOutcome(
                            selector_id=selector.id,
                            old_selector=selector.selector_key,
                            new_selector=repair_result.new_selector or "",
                            repair_method=repair_result.method,
                            status="success" if repair_result.success else "failed",
                            confidence=round(repair_result.confidence * 100),
                        )
                    )

                    if repair_result.success and repair_result.new_selector:
                        selector.selector_key = repair_result.new_selector
                        selector.repair_count += 1
                        selector.last_repaired_at = utc_now()
                        selector.repair_status = "success"
                    else:
                        selector.repair_status = "failed"

                    repaired.append(
                        {
                            "selectorId": selector.id,
                            "oldSelector": repair_result.old_selector,
                            "newSelector": repair_result.new_selector,
                            "method": repair_result.method,
                            "confidence": repair_result.confidence,
                            "success": repair_result.success,
                        }
                    )

            # Refresh the baseline so the next check compares against
            # the post-repair state, not the now-stale one.
            snapshot = create_snapshot(site.url)
            site.snapshot_hashes = snapshot["script_hashes"]
            site.snapshot_pages = snapshot["pages"]

        db.commit()

        return {
            "site_id": site.id,
            "detected_at": utc_now().isoformat(),
            "signal_type": result.change_type,
            "confidence": result.confidence,
            "detected": result.detected,
            "metadata": {"repaired": repaired, "changes": changes},
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to detect changes for site {req.site_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/selectors/{selector_id}/current")
async def get_current_selector(selector_id: str = Path(...)):
    """Get current selector for a selector ID.

    Args:
        selector_id: The selector ID

    Returns:
        Current selector information
    """
    try:
        logger.info(f"GET /api/selectors/{selector_id}/current - Fetching selector")
        return {
            "selectorId": selector_id,
            "currentSelector": "div.selector",
            "timestamp": "2025-01-01T00:00:00Z",
            "repairCount": 0,
            "lastRepaired": None,
        }
    except Exception as e:
        logger.error(f"Failed to fetch selector {selector_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting DriftLock Backend API on http://0.0.0.0:{port}")
    logger.info(f"Documentation available at http://localhost:{port}/docs")

    uvicorn.run(
        "backend.api:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
