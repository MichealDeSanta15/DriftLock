"""FastAPI bridge for detection and repair logic.

Exposes the Python backend functions as HTTP endpoints that Next.js can call.

Usage:
    python -m pip install fastapi uvicorn
    python backend/api.py

Server will run on http://localhost:8000

Endpoints:
    GET /health - Health check
    GET /api/sites - Get all sites
    POST /api/sites - Create a new site
    DELETE /api/sites/{site_id} - Delete a site
    POST /api/sites/detect - Detect website changes
    GET /api/selectors/{selector_id}/current - Get current selector
    POST /detect - Detect website changes (legacy)
    POST /repair - Repair broken selector (legacy)
    POST /snapshot - Create website snapshot (legacy)
"""

import logging
import sys
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.detection import detect_changes, create_snapshot
from backend.repair import repair_selector

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

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
    """Request to create a site."""

    name: str
    url: str


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


@app.get("/api/sites", response_model=SitesListResponse)
async def get_sites():
    """Get all sites.

    Returns:
        List of sites with their status and selector information
    """
    try:
        logger.info("GET /api/sites - Fetching all sites")
        # TODO: Connect to database and fetch sites
        # For now, return empty list to match frontend behavior
        return SitesListResponse(sites=[])
    except Exception as e:
        logger.error(f"Failed to fetch sites: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sites", response_model=SiteResponse)
async def create_site(req: CreateSiteRequest):
    """Create a new site.

    Args:
        req: Site creation request with name and URL

    Returns:
        Created site with ID and default status
    """
    try:
        logger.info(f"POST /api/sites - Creating site: {req.name}")
        site_id = str(uuid4())
        return SiteResponse(
            id=site_id,
            name=req.name,
            url=req.url,
            status="working",
            lastChecked="2025-01-01T00:00:00Z",
            selectorId="unknown",
            currentSelector="Not set",
        )
    except Exception as e:
        logger.error(f"Failed to create site: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sites/{site_id}")
async def delete_site(site_id: str = Path(...)):
    """Delete a site.

    Args:
        site_id: The site ID to delete

    Returns:
        Success message
    """
    try:
        logger.info(f"DELETE /api/sites/{site_id} - Deleting site")
        # TODO: Connect to database and delete site
        return {"success": True, "message": f"Site {site_id} deleted"}
    except Exception as e:
        logger.error(f"Failed to delete site {site_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sites/detect")
async def detect_site_changes(req: DetectAPIRequest):
    """Trigger detection on a site.

    Args:
        req: Detection request with site_id

    Returns:
        Detection result
    """
    try:
        logger.info(f"POST /api/sites/detect - Triggering detection for site {req.site_id}")
        return {
            "detected": False,
            "confidence": 0.0,
            "change_type": "none",
            "details": None,
        }
    except Exception as e:
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

    logger.info("Starting DriftLock Backend API on http://0.0.0.0:8000")
    logger.info("Documentation available at http://localhost:8000/docs")

    uvicorn.run(
        "backend.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
