-- Setup test data for Phase 4 testing
-- Run: psql driftlock -f scripts/setup-test-data.sql

-- Create test selector
INSERT INTO selectors (id, site_id, selector_key, is_current, repair_count, created_at, updated_at)
VALUES (
  'test_selector_1',
  'example_com',
  'h1.product-title',
  true,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  selector_key = 'h1.product-title',
  repair_count = 0,
  updated_at = NOW();

-- Create initial version
INSERT INTO selector_versions (selector_id, selector_value, version_number, created_at, is_backup, confidence_score)
VALUES (
  'test_selector_1',
  'h1.product-title',
  1,
  NOW(),
  false,
  100
) ON CONFLICT DO NOTHING;

-- Create backup version (for repair testing)
INSERT INTO selector_versions (selector_id, selector_value, version_number, created_at, is_backup, confidence_score)
VALUES (
  'test_selector_1',
  'h2.product-name',
  2,
  NOW(),
  true,
  95
) ON CONFLICT DO NOTHING;

-- Create initial snapshot of example.com
INSERT INTO snapshots (site_url, data, created_at)
VALUES (
  'https://example.com',
  '{"script_hashes": {"https://example.com/bundle.js": "abc123"}, "pages": {"https://example.com": "<html><head><script src=\"https://example.com/bundle.js\"></script></head><body><h1 class=\"product-title\">Example Product</h1></body></html>"}}',
  NOW()
) ON CONFLICT DO NOTHING;

-- Create another test selector
INSERT INTO selectors (id, site_id, selector_key, is_current, repair_count, created_at, updated_at)
VALUES (
  'test_selector_2',
  'example_com',
  'span.price',
  true,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  selector_key = 'span.price',
  repair_count = 0,
  updated_at = NOW();

-- Create version for second selector
INSERT INTO selector_versions (selector_id, selector_value, version_number, created_at, is_backup, confidence_score)
VALUES (
  'test_selector_2',
  'span.price',
  1,
  NOW(),
  false,
  100
) ON CONFLICT DO NOTHING;

-- Verify data
SELECT '[selectors]' as table_name;
SELECT id, selector_key, repair_count FROM selectors WHERE site_id = 'example_com';

SELECT '[selector_versions]' as table_name;
SELECT selector_id, version_number, selector_value, confidence_score FROM selector_versions;

SELECT '[snapshots]' as table_name;
SELECT site_url, created_at FROM snapshots ORDER BY created_at DESC LIMIT 1;

-- Display message
SELECT 'Test data setup complete! Ready to test POST /api/sites/detect with selectorIds: [''test_selector_1'', ''test_selector_2'']' as status;
