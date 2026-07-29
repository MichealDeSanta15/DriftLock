"""Selector repair using a cascade of strategies.

Repairs broken selectors by:
1. Trying backup selectors
2. Parsing JSON-LD structured data
3. Reverse-searching: find the old value in new HTML and extract its selector
"""

import json
import logging
from dataclasses import dataclass
from typing import Optional

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

logger = logging.getLogger(__name__)


@dataclass
class RepairResult:
    """Result of a selector repair attempt."""

    success: bool
    old_selector: Optional[str]
    new_selector: Optional[str]
    method: str
    confidence: float = 0.0
    details: Optional[dict] = None


def try_backup_selectors(html: str, backup_selectors: list[str]) -> Optional[tuple[str, float]]:
    """Try existing backup selectors on the page.

    Args:
        html: Current HTML of the page.
        backup_selectors: List of alternative selector strings to try.

    Returns:
        Tuple of (selector, confidence) if a backup works, None otherwise.
    """
    soup = BeautifulSoup(html, "html.parser")

    for selector in backup_selectors:
        try:
            results = soup.select(selector)
            if results:
                confidence = min(len(results) / 10.0, 1.0)
                return selector, confidence
        except Exception as e:
            logger.debug(f"Backup selector failed: {selector} - {e}")
            continue

    return None


def parse_json_ld(html: str, target_data: Optional[str] = None) -> Optional[tuple[str, float]]:
    """Extract data from JSON-LD structured data.

    Looks for @type: Product, Article, BreadcrumbList, etc.
    If target_data is provided, tries to find a selector containing it.

    Args:
        html: Page HTML.
        target_data: Text/value we're looking for (e.g., product price, title).

    Returns:
        Tuple of (selector, confidence) if found, None otherwise.
    """
    soup = BeautifulSoup(html, "html.parser")

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and "@type" in data:
                if target_data:
                    ld_text = json.dumps(data)
                    if target_data in ld_text:
                        selector = _extract_selector_from_ld(soup, data)
                        if selector:
                            return selector, 0.85
                else:
                    selector = _extract_selector_from_ld(soup, data)
                    if selector:
                        return selector, 0.75

        except json.JSONDecodeError as e:
            logger.debug(f"Failed to parse JSON-LD: {e}")
            continue

    return None


def _extract_selector_from_ld(soup: BeautifulSoup, ld_data: dict) -> Optional[str]:
    """Helper to find a CSS selector pointing to JSON-LD data in the DOM.

    Args:
        soup: BeautifulSoup object of the page.
        ld_data: Parsed JSON-LD dictionary.

    Returns:
        CSS selector as a string, or None if not found.
    """
    text_to_find = None

    if "name" in ld_data:
        text_to_find = ld_data["name"]
    elif "headline" in ld_data:
        text_to_find = ld_data["headline"]
    elif "title" in ld_data:
        text_to_find = ld_data["title"]
    elif "price" in ld_data:
        text_to_find = str(ld_data["price"])

    if not text_to_find:
        return None

    for element in soup.find_all(string=lambda x: text_to_find in str(x) if x else False):
        parent = element.parent
        if parent and parent.name:
            if parent.get("class"):
                return f"{parent.name}.{'.'.join(parent['class'])}"
            elif parent.get("id"):
                return f"{parent.name}#{parent['id']}"
            else:
                return parent.name

    return None


def reverse_search(old_html: str, new_html: str, old_selector: str, target_text: Optional[str] = None) -> Optional[tuple[str, float]]:
    """Find where the old selector's content moved to in the new HTML.

    Strategy:
    1. Extract text from old_selector in old_html
    2. Search for that text in new_html
    3. Return the selector of the element containing it

    Args:
        old_html: Previous version of the page.
        new_html: Current version of the page.
        old_selector: The CSS selector that used to work.
        target_text: Optional text to search for. If None, extracted from old_html.

    Returns:
        Tuple of (new_selector, confidence) if found, None otherwise.
    """
    old_soup = BeautifulSoup(old_html, "html.parser")
    new_soup = BeautifulSoup(new_html, "html.parser")

    if target_text is None:
        try:
            elements = old_soup.select(old_selector)
            if not elements:
                return None
            target_text = elements[0].get_text(strip=True)[:100]
        except Exception as e:
            logger.debug(f"Failed to extract text from old selector: {e}")
            return None

    if not target_text:
        return None

    irrelevant_tags = {"script", "style", "meta", "link", "noscript"}

    for element in new_soup.find_all(string=lambda x: target_text in str(x) if x else False):
        parent = element.parent
        if parent and isinstance(parent, Tag) and parent.name not in irrelevant_tags:
            selector = _build_css_selector(parent)
            if selector:
                return selector, 0.8

    return None


def _build_css_selector(element: Tag) -> Optional[str]:
    """Build a CSS selector for a given element.

    Prefers classes, then ID, then tag name.

    Args:
        element: BeautifulSoup Tag object.

    Returns:
        CSS selector as a string, or None.
    """
    if element.name is None:
        return None

    if element.get("class"):
        classes = " ".join(element["class"])
        return f"{element.name}.{classes.replace(' ', '.')}"
    elif element.get("id"):
        return f"{element.name}#{element['id']}"
    else:
        return element.name


def repair_selector(
    site_url: str,
    old_selector: str,
    old_html: str,
    new_html: str,
    backup_selectors: Optional[list[str]] = None,
) -> RepairResult:
    """Repair a broken selector using a cascade of strategies.

    Tries in order:
    1. Backup selectors (alternative CSS paths)
    2. JSON-LD structured data
    3. Reverse-search (find old content in new HTML)

    Args:
        site_url: The website URL (for context).
        old_selector: The CSS selector that stopped working.
        old_html: HTML from before the change.
        new_html: Current HTML after the change.
        backup_selectors: List of alternative selectors to try first.

    Returns:
        RepairResult with success flag, new selector, method used, and confidence.
    """
    details = {"strategies": {}}

    if backup_selectors is None:
        backup_selectors = []

    result = try_backup_selectors(new_html, backup_selectors)
    if result:
        new_selector, confidence = result
        return RepairResult(
            success=True,
            old_selector=old_selector,
            new_selector=new_selector,
            method="backup_selector",
            confidence=confidence,
            details=details,
        )

    details["strategies"]["backup_selectors"] = {"tried": len(backup_selectors), "success": False}

    target_text = None
    try:
        soup = BeautifulSoup(old_html, "html.parser")
        elements = soup.select(old_selector)
        if elements:
            target_text = elements[0].get_text(strip=True)[:100]
    except Exception as e:
        logger.debug(f"Could not extract target text: {e}")

    result = parse_json_ld(new_html, target_text)
    if result:
        new_selector, confidence = result
        return RepairResult(
            success=True,
            old_selector=old_selector,
            new_selector=new_selector,
            method="json_ld",
            confidence=confidence,
            details=details,
        )

    details["strategies"]["json_ld"] = {"success": False}

    result = reverse_search(old_html, new_html, old_selector, target_text)
    if result:
        new_selector, confidence = result
        return RepairResult(
            success=True,
            old_selector=old_selector,
            new_selector=new_selector,
            method="reverse_search",
            confidence=confidence,
            details=details,
        )

    details["strategies"]["reverse_search"] = {"success": False}

    return RepairResult(
        success=False,
        old_selector=old_selector,
        new_selector=None,
        method="all_failed",
        confidence=0.0,
        details=details,
    )


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
