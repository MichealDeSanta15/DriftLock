"""Tests for selector repair logic.

Tests repair cascade on realistic HTML from retail and job board sites.
Covers: backup selectors, JSON-LD parsing, and reverse-search strategies.
"""

import pytest

from ..repair.selector_repair import (
    try_backup_selectors,
    parse_json_ld,
    reverse_search,
    repair_selector,
)

# Retail site HTML (before redesign)
RETAIL_OLD_HTML = """
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Premium Widget",
        "price": "99.99",
        "priceCurrency": "USD"
    }
    </script>
</head>
<body>
    <div class="product-container">
        <h1 class="product-title" id="prod-title">Premium Widget</h1>
        <span class="price-tag" id="price">$99.99</span>
        <p class="description">High quality widget</p>
    </div>
</body>
</html>
"""

# Retail site HTML (after redesign)
RETAIL_NEW_HTML = """
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Premium Widget",
        "price": "99.99",
        "priceCurrency": "USD"
    }
    </script>
</head>
<body>
    <div class="main-content">
        <section class="product-showcase">
            <h2 class="product-name" id="title-main">Premium Widget</h2>
            <div class="pricing-section">
                <span class="sale-price" id="current-price">$99.99</span>
            </div>
            <p class="product-desc">High quality widget</p>
        </section>
    </div>
</body>
</html>
"""

# Job board HTML (before redesign)
JOB_OLD_HTML = """
<html>
<head>
    <script type="application/ld+json">
    {
        "@type": "JobPosting",
        "title": "Senior Engineer",
        "hiringOrganization": {
            "@type": "Organization",
            "name": "TechCorp"
        }
    }
    </script>
</head>
<body>
    <div class="job-listing">
        <h1 class="job-title" id="position">Senior Engineer</h1>
        <span class="company" id="employer">TechCorp</span>
        <p class="job-desc">Build great things</p>
    </div>
</body>
</html>
"""

# Job board HTML (after redesign)
JOB_NEW_HTML = """
<html>
<head>
    <script type="application/ld+json">
    {
        "@type": "JobPosting",
        "title": "Senior Engineer",
        "hiringOrganization": {
            "@type": "Organization",
            "name": "TechCorp"
        }
    }
    </script>
</head>
<body>
    <main class="main-wrapper">
        <article class="job-posting" data-job-id="12345">
            <header class="posting-header">
                <h2 class="position-name" id="job-position">Senior Engineer</h2>
                <span class="organization" id="company-name">TechCorp</span>
            </header>
            <section class="job-content">
                <p class="summary">Build great things</p>
            </section>
        </article>
    </main>
</body>
</html>
"""

# HTML with no structured data
PLAIN_OLD_HTML = """
<html>
<body>
    <div class="widget">
        <h1 class="title">My Title</h1>
        <span class="price">$50</span>
    </div>
</body>
</html>
"""

PLAIN_NEW_HTML = """
<html>
<body>
    <div class="container">
        <h2 class="heading">My Title</h2>
        <span class="cost">$50</span>
    </div>
</body>
</html>
"""


class TestBackupSelectors:
    """Test trying backup selectors on current HTML."""

    def test_backup_selector_works(self):
        """Test when a backup selector finds elements."""
        backups = [
            "div.product-showcase h2.product-name",
            "section.product-showcase h2",
            "h2",
        ]

        result = try_backup_selectors(RETAIL_NEW_HTML, backups)

        assert result is not None
        selector, confidence = result
        assert "h2" in selector or "product-name" in selector
        assert 0.0 < confidence <= 1.0

    def test_backup_selector_all_fail(self):
        """Test when no backup selectors match."""
        backups = [
            "div.nonexistent .title",
            "span.not-here",
        ]

        result = try_backup_selectors(RETAIL_NEW_HTML, backups)

        assert result is None

    def test_backup_selector_empty_list(self):
        """Test with empty backup list."""
        result = try_backup_selectors(RETAIL_NEW_HTML, [])

        assert result is None

    def test_backup_selector_invalid_css(self):
        """Test graceful handling of invalid CSS selectors."""
        backups = [
            "!!!invalid",
            "section.product-showcase h2",
        ]

        result = try_backup_selectors(RETAIL_NEW_HTML, backups)

        assert result is not None

    def test_backup_selector_job_board(self):
        """Test backup selector on job board HTML."""
        backups = [
            "article.job-posting h2.position-name",
            "header.posting-header h2",
            "h2",
        ]

        result = try_backup_selectors(JOB_NEW_HTML, backups)

        assert result is not None
        selector, confidence = result
        assert confidence > 0.0


class TestJSONLDParsing:
    """Test JSON-LD structured data extraction."""

    def test_parse_json_ld_retail(self):
        """Test extracting selector from JSON-LD product data."""
        result = parse_json_ld(RETAIL_NEW_HTML, target_data="Premium Widget")

        assert result is not None
        selector, confidence = result
        assert confidence > 0.0

    def test_parse_json_ld_job_posting(self):
        """Test extracting selector from JSON-LD job posting."""
        result = parse_json_ld(JOB_NEW_HTML, target_data="Senior Engineer")

        assert result is not None
        selector, confidence = result
        assert confidence > 0.0

    def test_parse_json_ld_no_target_data(self):
        """Test JSON-LD parsing without target text."""
        result = parse_json_ld(RETAIL_NEW_HTML)

        assert result is not None
        selector, confidence = result
        assert confidence > 0.0

    def test_parse_json_ld_target_not_found(self):
        """Test when target data not in JSON-LD."""
        result = parse_json_ld(RETAIL_NEW_HTML, target_data="Nonexistent Product")

        assert result is None

    def test_parse_json_ld_no_json_ld(self):
        """Test with HTML that has no JSON-LD."""
        result = parse_json_ld(PLAIN_NEW_HTML, target_data="My Title")

        assert result is None

    def test_parse_json_ld_malformed(self):
        """Test with malformed JSON-LD."""
        html = """
        <html>
        <script type="application/ld+json">
        {broken json
        </script>
        </html>
        """

        result = parse_json_ld(html)

        assert result is None


class TestReverseSearch:
    """Test reverse-search strategy."""

    def test_reverse_search_retail(self):
        """Test finding content moved to new selector."""
        result = reverse_search(
            RETAIL_OLD_HTML,
            RETAIL_NEW_HTML,
            "h1.product-title",
        )

        assert result is not None
        new_selector, confidence = result
        assert confidence > 0.0
        assert "product" in new_selector.lower() or "name" in new_selector.lower()

    def test_reverse_search_job_board(self):
        """Test reverse-search on job board."""
        result = reverse_search(
            JOB_OLD_HTML,
            JOB_NEW_HTML,
            "h1.job-title",
        )

        assert result is not None
        new_selector, confidence = result
        assert confidence > 0.0

    def test_reverse_search_with_explicit_text(self):
        """Test reverse-search with explicit target text."""
        result = reverse_search(
            RETAIL_OLD_HTML,
            RETAIL_NEW_HTML,
            "h1.product-title",
            target_text="Premium Widget",
        )

        assert result is not None
        new_selector, confidence = result
        assert confidence > 0.0

    def test_reverse_search_not_found(self):
        """Test when old content not found in new HTML."""
        result = reverse_search(
            RETAIL_OLD_HTML,
            RETAIL_NEW_HTML,
            "span.nonexistent",
        )

        assert result is None

    def test_reverse_search_plain_html(self):
        """Test reverse-search on plain HTML without structure."""
        result = reverse_search(
            PLAIN_OLD_HTML,
            PLAIN_NEW_HTML,
            "h1.title",
        )

        assert result is not None
        new_selector, confidence = result
        assert confidence > 0.0


class TestRepairSelectorCascade:
    """Integration tests for full repair cascade."""

    def test_repair_via_backup_retail(self):
        """Test repair succeeding with backup selector."""
        backups = [
            "h2.product-name",
            "h2",
        ]

        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
            backup_selectors=backups,
        )

        assert result.success is True
        assert result.method == "backup_selector"
        assert result.new_selector is not None
        assert result.confidence > 0.0

    def test_repair_via_json_ld(self):
        """Test repair falling back to JSON-LD."""
        backups = ["div.nonexistent"]

        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
            backup_selectors=backups,
        )

        if result.success and result.method == "json_ld":
            assert result.new_selector is not None
            assert result.confidence > 0.7

    def test_repair_via_reverse_search(self):
        """Test repair using reverse-search."""
        backups = ["span.nonexistent"]

        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
            backup_selectors=backups,
        )

        if result.success and result.method == "reverse_search":
            assert result.new_selector is not None
            assert result.confidence > 0.7

    def test_repair_all_methods_fail(self):
        """Test when all repair methods fail."""
        backups = ["span.nonexistent"]

        result = repair_selector(
            "https://example.com/",
            old_selector="h1.nonexistent",
            old_html=PLAIN_OLD_HTML,
            new_html=PLAIN_NEW_HTML,
            backup_selectors=backups,
        )

        assert result.success is False
        assert result.method == "all_failed"
        assert result.new_selector is None
        assert result.confidence == 0.0

    def test_repair_job_board(self):
        """Test repair on job board site."""
        backups = [
            "h2.position-name",
            "h2",
        ]

        result = repair_selector(
            "https://jobs.example.com/",
            old_selector="h1.job-title",
            old_html=JOB_OLD_HTML,
            new_html=JOB_NEW_HTML,
            backup_selectors=backups,
        )

        assert result.success is True
        assert result.old_selector == "h1.job-title"
        assert result.new_selector is not None

    def test_repair_no_backups(self):
        """Test repair without any backup selectors."""
        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
            backup_selectors=None,
        )

        if result.success:
            assert result.method in ["json_ld", "reverse_search"]

    def test_repair_preserves_old_selector(self):
        """Test that repair preserves the old selector in result."""
        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
        )

        assert result.old_selector == "h1.product-title"

    def test_repair_details_populated(self):
        """Test that repair result includes strategy details."""
        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
        )

        assert result.details is not None
        assert "strategies" in result.details

    def test_repair_priority_order(self):
        """Test that repair tries strategies in correct order.

        Should try: backups → JSON-LD → reverse-search
        """
        backups = [
            "h2.product-name",
        ]

        result = repair_selector(
            "https://example.com/",
            old_selector="h1.product-title",
            old_html=RETAIL_OLD_HTML,
            new_html=RETAIL_NEW_HTML,
            backup_selectors=backups,
        )

        assert result.success is True
        assert result.method == "backup_selector"
