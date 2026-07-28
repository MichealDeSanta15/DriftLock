"""Detection logic for identifying website changes.

Detects redesigns using:
- JS bundle hash comparison
- DOM diff analysis
- Multi-page template shift detection
"""

from backend.detection.site_monitor import (
    DetectionResult,
    detect_changes,
    create_snapshot,
    extract_script_hashes,
    compare_script_hashes,
    calculate_dom_diff,
    detect_template_shift,
)

__all__ = [
    "DetectionResult",
    "detect_changes",
    "create_snapshot",
    "extract_script_hashes",
    "compare_script_hashes",
    "calculate_dom_diff",
    "detect_template_shift",
]
