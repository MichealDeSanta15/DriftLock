"""Repair logic for fixing broken selectors.

Repairs using a cascade:
1. Backup selectors (alternative CSS paths)
2. JSON-LD structured data extraction
3. Reverse-search (find old content in new HTML)
"""

from backend.repair.selector_repair import (
    RepairResult,
    repair_selector,
    try_backup_selectors,
    parse_json_ld,
    reverse_search,
)

__all__ = [
    "RepairResult",
    "repair_selector",
    "try_backup_selectors",
    "parse_json_ld",
    "reverse_search",
]
