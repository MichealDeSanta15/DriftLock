"""Website change detection using multiple strategies.

Monitors for redesigns, template shifts, and structural changes using:
- JS bundle hash comparison
- DOM diff analysis
- Multi-page template shift detection
"""

import hashlib
import logging
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    """Result of a website change detection check."""

    detected: bool
    confidence: float
    change_type: str
    details: Optional[dict] = None


def extract_script_hashes(html: str) -> dict[str, str]:
    """Extract and hash all external script sources from HTML.

    Args:
        html: Raw HTML content from a page.

    Returns:
        Dictionary mapping script src URLs to their hashes.
    """
    soup = BeautifulSoup(html, "html.parser")
    hashes = {}

    for script in soup.find_all("script", src=True):
        src = script.get("src")
        if src:
            hashes[src] = hashlib.md5(src.encode()).hexdigest()

    return hashes


def compare_script_hashes(old_hashes: dict[str, str], new_hashes: dict[str, str]) -> tuple[bool, float]:
    """Compare script hashes between two page versions.

    Detects JS bundle updates (new bundles, removed bundles, hash changes).

    Args:
        old_hashes: Script hashes from the previous check.
        new_hashes: Script hashes from the current check.

    Returns:
        Tuple of (changed: bool, confidence: float from 0.0 to 1.0)
    """
    old_set = set(old_hashes.keys())
    new_set = set(new_hashes.keys())

    added = new_set - old_set
    removed = old_set - new_set
    changed = sum(1 for src in old_set & new_set if old_hashes[src] != new_hashes[src])

    total_scripts = len(old_set)
    if total_scripts == 0:
        if new_set:
            return True, 1.0
        return False, 0.0

    change_ratio = (len(added) + len(removed) + changed) / total_scripts
    confidence = min(change_ratio, 1.0)

    return change_ratio > 0, confidence


def calculate_dom_diff(old_html: str, new_html: str) -> tuple[int, float]:
    """Calculate DOM structure differences between two versions.

    Simple diff: count added/removed tags, class changes, ID changes.
    Returns the count of changes and a confidence score.

    Args:
        old_html: Previous HTML version.
        new_html: Current HTML version.

    Returns:
        Tuple of (change_count: int, confidence: float)
    """
    old_soup = BeautifulSoup(old_html, "html.parser")
    new_soup = BeautifulSoup(new_html, "html.parser")

    old_tags = str(old_soup.body or old_soup)
    new_tags = str(new_soup.body or new_soup)

    old_lines = old_tags.split("\n")
    new_lines = new_tags.split("\n")

    changes = abs(len(old_lines) - len(new_lines))

    for old_line in old_lines:
        if old_line.strip() and old_line.strip() not in new_tags:
            changes += 1

    max_lines = max(len(old_lines), len(new_lines))
    if max_lines == 0:
        confidence = 0.0
    else:
        confidence = min(changes / (max_lines * 0.5), 1.0)

    return changes, confidence


def detect_template_shift(page_diffs: list[tuple[int, float]]) -> tuple[bool, float]:
    """Detect if many pages show structural changes (template redesign).

    If 40%+ of pages show significant DOM changes, it's likely a redesign.

    Args:
        page_diffs: List of (change_count, confidence) tuples from multiple pages.

    Returns:
        Tuple of (is_redesign: bool, confidence: float)
    """
    if not page_diffs:
        return False, 0.0

    high_change_count = sum(1 for _, conf in page_diffs if conf > 0.5)
    threshold = len(page_diffs) * 0.4

    is_redesign = high_change_count >= threshold
    confidence = high_change_count / len(page_diffs) if page_diffs else 0.0

    return is_redesign, confidence


def fetch_page(url: str, timeout: int = 10) -> Optional[str]:
    """Fetch a page with error handling.

    Args:
        url: Full URL to fetch.
        timeout: Request timeout in seconds.

    Returns:
        HTML content, or None if fetch fails.
    """
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        logger.warning(f"Failed to fetch {url}: {e}")
        return None


def detect_changes(
    site_url: str,
    old_snapshot: Optional[dict] = None,
    page_urls: Optional[list[str]] = None,
) -> DetectionResult:
    """Detect website changes using multiple strategies.

    Args:
        site_url: Base URL of the website.
        old_snapshot: Previous snapshot {script_hashes, dom_hash} for comparison.
        page_urls: List of page URLs to check for template shifts. If None, only checks site_url.

    Returns:
        DetectionResult with detected flag, confidence, and change type.
    """
    changes_detected = []
    confidences = []
    details = {"strategies": {}}

    if page_urls is None:
        page_urls = [site_url]

    pages_checked = 0
    page_diffs = []

    for page_url in page_urls:
        html = fetch_page(page_url)
        if not html:
            continue

        pages_checked += 1

        old_html = old_snapshot.get("pages", {}).get(page_url) if old_snapshot else None

        if old_html:
            change_count, dom_confidence = calculate_dom_diff(old_html, html)
            page_diffs.append((change_count, dom_confidence))

            if dom_confidence > 0.3:
                changes_detected.append("dom_change")
                confidences.append(dom_confidence)

    if page_diffs:
        is_redesign, redesign_confidence = detect_template_shift(page_diffs)
        if is_redesign:
            changes_detected.append("template_shift")
            confidences.append(redesign_confidence)
            details["strategies"]["template_shift"] = {
                "confidence": redesign_confidence,
                "pages_with_changes": sum(1 for _, c in page_diffs if c > 0.5),
                "total_pages": len(page_diffs),
            }

    main_html = fetch_page(site_url)
    if main_html and old_snapshot:
        new_hashes = extract_script_hashes(main_html)
        old_hashes = old_snapshot.get("script_hashes", {})

        if old_hashes:
            changed, hash_confidence = compare_script_hashes(old_hashes, new_hashes)
            if changed:
                changes_detected.append("script_change")
                confidences.append(hash_confidence)
                details["strategies"]["script_change"] = {
                    "confidence": hash_confidence,
                }

        details["current_script_hashes"] = new_hashes

    detected = len(changes_detected) > 0
    overall_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    change_type = ", ".join(set(changes_detected)) if changes_detected else "no_change"

    details["pages_checked"] = pages_checked

    return DetectionResult(
        detected=detected,
        confidence=overall_confidence,
        change_type=change_type,
        details=details,
    )


def create_snapshot(site_url: str, page_urls: Optional[list[str]] = None) -> dict:
    """Create a snapshot of the current website state for comparison.

    Args:
        site_url: Base URL of the website.
        page_urls: List of page URLs to snapshot. If None, only snapshots site_url.

    Returns:
        Dictionary with script_hashes and page content for later comparison.
    """
    if page_urls is None:
        page_urls = [site_url]

    snapshot = {
        "script_hashes": {},
        "pages": {},
    }

    main_html = fetch_page(site_url)
    if main_html:
        snapshot["script_hashes"] = extract_script_hashes(main_html)

    for page_url in page_urls:
        html = fetch_page(page_url)
        if html:
            snapshot["pages"][page_url] = html

    return snapshot
