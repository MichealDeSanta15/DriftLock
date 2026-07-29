"""Tests for website change detection.

Tests detection on realistic HTML from 2 sites:
1. Retail site (product listing)
2. Job board (job listing)
"""

import pytest
import responses

from ..detection.site_monitor import (
    extract_script_hashes,
    compare_script_hashes,
    calculate_dom_diff,
    detect_template_shift,
    detect_changes,
    create_snapshot,
)

# Mock HTML: Retail site (Amazon-like product page)
RETAIL_HTML_V1 = """
<html>
<head>
    <script src="https://cdn.example.com/bundle-abc123.js"></script>
    <script src="https://cdn.example.com/analytics.js"></script>
</head>
<body>
    <div class="container">
        <div class="product-header">
            <h1 class="product-title">Widget Pro 2000</h1>
            <span class="price" id="current-price">$99.99</span>
        </div>
        <div class="product-details">
            <p class="description">High-quality widget</p>
            <div class="reviews">
                <span class="rating">4.5 stars</span>
            </div>
        </div>
    </div>
</body>
</html>
"""

RETAIL_HTML_V2 = """
<html>
<head>
    <script src="https://cdn.example.com/bundle-xyz789.js"></script>
    <script src="https://cdn.example.com/analytics-v2.js"></script>
    <script src="https://cdn.example.com/tracking.js"></script>
</head>
<body>
    <div class="main-container">
        <section class="product-showcase">
            <div class="product-info">
                <h2 class="product-name">Widget Pro 2000</h2>
                <div class="pricing">
                    <span class="sale-price" id="price-value">$89.99</span>
                </div>
            </div>
            <section class="product-meta">
                <p class="short-desc">Premium widget</p>
                <div class="ratings-section">
                    <span class="stars">4.5 out of 5</span>
                </div>
            </section>
        </section>
    </div>
</body>
</html>
"""

# Mock HTML: Job board (Indeed-like job posting)
JOB_HTML_V1 = """
<html>
<head>
    <script src="https://jobs.example.com/static/bundle-v1.js"></script>
</head>
<body>
    <div class="job-container">
        <h1 class="job-title">Senior Software Engineer</h1>
        <div class="company-info">
            <span class="company-name">TechCorp Inc</span>
            <span class="location">San Francisco, CA</span>
        </div>
        <div class="job-details">
            <p class="salary">$150,000 - $180,000</p>
            <ul class="requirements">
                <li>5+ years experience</li>
                <li>Python/Go</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""

JOB_HTML_V2 = """
<html>
<head>
    <script src="https://jobs.example.com/static/bundle-v2.js"></script>
    <script src="https://jobs.example.com/static/search-module.js"></script>
</head>
<body>
    <main class="main-content">
        <article class="job-posting">
            <header class="posting-header">
                <h1 class="position-title">Senior Software Engineer</h1>
                <section class="employer-details">
                    <span class="employer">TechCorp Inc</span>
                    <span class="job-location">San Francisco, CA</span>
                </section>
            </header>
            <section class="job-description">
                <p class="compensation">$150,000 - $180,000</p>
                <ol class="skills-needed">
                    <li>5+ years experience</li>
                    <li>Python/Go</li>
                </ol>
            </section>
        </article>
    </main>
</body>
</html>
"""


class TestScriptHashExtraction:
    """Test extracting and hashing script tags."""

    def test_extract_script_hashes(self):
        """Test extracting script src attributes."""
        hashes = extract_script_hashes(RETAIL_HTML_V1)

        assert len(hashes) == 2
        assert "https://cdn.example.com/bundle-abc123.js" in hashes
        assert "https://cdn.example.com/analytics.js" in hashes

    def test_extract_script_hashes_empty(self):
        """Test with no scripts."""
        html = "<html><body><p>No scripts here</p></body></html>"
        hashes = extract_script_hashes(html)

        assert len(hashes) == 0

    def test_extract_inline_scripts_ignored(self):
        """Test that inline scripts (no src) are ignored."""
        html = '<html><script>console.log("hi")</script><script src="real.js"></script></html>'
        hashes = extract_script_hashes(html)

        assert len(hashes) == 1
        assert "real.js" in list(hashes.keys())[0]


class TestScriptHashComparison:
    """Test comparing script hashes between versions."""

    def test_scripts_changed_retail(self):
        """Test script change detection on retail site."""
        hashes_v1 = extract_script_hashes(RETAIL_HTML_V1)
        hashes_v2 = extract_script_hashes(RETAIL_HTML_V2)

        changed, confidence = compare_script_hashes(hashes_v1, hashes_v2)

        assert changed is True
        assert 0.4 < confidence <= 1.0

    def test_scripts_unchanged(self):
        """Test when scripts haven't changed."""
        hashes_v1 = extract_script_hashes(RETAIL_HTML_V1)
        hashes_v2 = extract_script_hashes(RETAIL_HTML_V1)

        changed, confidence = compare_script_hashes(hashes_v1, hashes_v2)

        assert changed is False
        assert confidence == 0.0

    def test_no_scripts_old(self):
        """Test with no old scripts."""
        changed, confidence = compare_script_hashes({}, extract_script_hashes(RETAIL_HTML_V1))

        assert changed is True
        assert confidence > 0.0


class TestDOMDiff:
    """Test DOM structure diffing."""

    def test_dom_diff_retail(self):
        """Test DOM diff on retail site with structure change."""
        changes, confidence = calculate_dom_diff(RETAIL_HTML_V1, RETAIL_HTML_V2)

        assert changes > 0
        assert 0.0 <= confidence <= 1.0

    def test_dom_diff_no_change(self):
        """Test when DOM is identical."""
        changes, confidence = calculate_dom_diff(RETAIL_HTML_V1, RETAIL_HTML_V1)

        assert changes == 0
        assert confidence == 0.0

    def test_dom_diff_job_board(self):
        """Test DOM diff on job board."""
        changes, confidence = calculate_dom_diff(JOB_HTML_V1, JOB_HTML_V2)

        assert changes > 0
        assert 0.0 <= confidence <= 1.0

    def test_dom_diff_empty_html(self):
        """Test with empty HTML."""
        changes, confidence = calculate_dom_diff("", "")

        assert changes == 0
        assert confidence == 0.0


class TestTemplateShiftDetection:
    """Test multi-page template shift detection."""

    def test_template_shift_detected(self):
        """Test detecting redesign across multiple pages."""
        page_diffs = [
            (15, 0.6),
            (20, 0.7),
            (18, 0.65),
            (5, 0.2),
            (3, 0.1),
        ]

        is_redesign, confidence = detect_template_shift(page_diffs)

        assert is_redesign is True
        assert confidence > 0.5

    def test_no_template_shift(self):
        """Test when few pages show changes."""
        page_diffs = [
            (2, 0.1),
            (1, 0.05),
            (3, 0.15),
            (0, 0.0),
            (1, 0.1),
        ]

        is_redesign, confidence = detect_template_shift(page_diffs)

        assert is_redesign is False
        assert confidence < 0.4

    def test_empty_page_diffs(self):
        """Test with no pages."""
        is_redesign, confidence = detect_template_shift([])

        assert is_redesign is False
        assert confidence == 0.0

    def test_threshold_boundary(self):
        """Test exactly at 40% threshold."""
        page_diffs = [
            (10, 0.6),
            (10, 0.6),
            (1, 0.05),
            (1, 0.05),
            (1, 0.05),
        ]

        is_redesign, confidence = detect_template_shift(page_diffs)

        assert is_redesign is True
        assert confidence == 0.4


class TestDetectionIntegration:
    """Integration tests for full detection flow."""

    @responses.activate
    def test_detect_changes_retail_site(self):
        """Test detection on retail site with mocked HTTP."""
        responses.add(responses.GET, "https://example.com/", body=RETAIL_HTML_V1)

        old_snapshot = create_snapshot("https://example.com/")
        assert old_snapshot is not None
        assert len(old_snapshot["script_hashes"]) == 2

        responses.reset()
        responses.add(responses.GET, "https://example.com/", body=RETAIL_HTML_V2)

        result = detect_changes("https://example.com/", old_snapshot=old_snapshot)

        assert result.detected is True
        assert result.confidence > 0.0
        assert "script_change" in result.change_type or "dom_change" in result.change_type

    @responses.activate
    def test_detect_changes_job_board(self):
        """Test detection on job board site."""
        responses.add(responses.GET, "https://jobs.example.com/listing/123", body=JOB_HTML_V1)

        old_snapshot = create_snapshot("https://jobs.example.com/listing/123")
        assert old_snapshot is not None

        responses.reset()
        responses.add(responses.GET, "https://jobs.example.com/listing/123", body=JOB_HTML_V2)

        result = detect_changes("https://jobs.example.com/listing/123", old_snapshot=old_snapshot)

        assert result.detected is True
        assert result.confidence > 0.0

    @responses.activate
    def test_detect_no_changes(self):
        """Test when site hasn't changed."""
        responses.add(responses.GET, "https://stable.example.com/", body=RETAIL_HTML_V1)

        old_snapshot = create_snapshot("https://stable.example.com/")
        responses.reset()
        responses.add(responses.GET, "https://stable.example.com/", body=RETAIL_HTML_V1)

        result = detect_changes("https://stable.example.com/", old_snapshot=old_snapshot)

        assert result.detected is False
        assert result.confidence == 0.0

    @responses.activate
    def test_detect_with_multiple_pages(self):
        """Test template shift detection across multiple pages."""
        page_urls = [
            "https://example.com/page1",
            "https://example.com/page2",
            "https://example.com/page3",
        ]

        for url in page_urls:
            responses.add(responses.GET, url, body=RETAIL_HTML_V1)

        old_snapshot = create_snapshot("https://example.com/", page_urls=page_urls)

        responses.reset()
        responses.add(responses.GET, "https://example.com/", body=RETAIL_HTML_V2)
        for url in page_urls:
            responses.add(responses.GET, url, body=RETAIL_HTML_V2)

        result = detect_changes(
            "https://example.com/",
            old_snapshot=old_snapshot,
            page_urls=page_urls,
        )

        assert result.detected is True
        if "template_shift" in result.change_type:
            assert result.details["strategies"]["template_shift"]["total_pages"] == 3

    @responses.activate
    def test_detect_with_fetch_failure(self):
        """Test graceful handling when fetch fails."""
        result = detect_changes("https://unreachable.example.com/")

        assert result.detected is False
        assert result.confidence == 0.0
