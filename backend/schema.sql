-- DriftLock Database Schema
-- Generated from Alembic migrations
-- This is a reference file showing the final schema structure

-- ============================================================================
-- SITES TABLE
-- Represents websites being monitored by DriftLock
-- ============================================================================

CREATE TABLE sites (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (id)
);

CREATE INDEX idx_owner_is_active ON sites(owner_id, is_active);
COMMENT ON TABLE sites IS 'Monitored websites';
COMMENT ON COLUMN sites.owner_id IS 'Customer or owner ID';
COMMENT ON COLUMN sites.is_active IS 'Enable/disable monitoring';

-- ============================================================================
-- SELECTORS TABLE
-- CSS/XPath selectors targeting data on websites
-- ============================================================================

CREATE TABLE selectors (
    id VARCHAR(36) NOT NULL,
    site_id VARCHAR(36) NOT NULL,
    selector_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT true,
    repair_count INTEGER NOT NULL DEFAULT 0,
    last_repaired_at TIMESTAMP WITH TIME ZONE,
    old_selector TEXT,
    new_selector TEXT,
    repair_method VARCHAR(64),
    repair_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    PRIMARY KEY (id),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX idx_site_is_current ON selectors(site_id, is_current);
CREATE INDEX idx_selector_key ON selectors(selector_key);
CREATE INDEX idx_site_id_selectors ON selectors(site_id);
COMMENT ON TABLE selectors IS 'CSS/XPath selectors with repair history';
COMMENT ON COLUMN selectors.is_current IS 'Active selector flag';
COMMENT ON COLUMN selectors.repair_count IS 'Number of repairs applied';

-- ============================================================================
-- DETECTION_EVENTS TABLE
-- Logs of detected selector changes on websites
-- ============================================================================

CREATE TABLE detection_events (
    id VARCHAR(36) NOT NULL,
    site_id VARCHAR(36) NOT NULL,
    selector_id VARCHAR(36),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    signal_type VARCHAR(64) NOT NULL,
    confidence INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE CASCADE
);

CREATE INDEX idx_site_detected_at ON detection_events(site_id, detected_at);
CREATE INDEX idx_selector_id_detection_events ON detection_events(selector_id);
COMMENT ON TABLE detection_events IS 'Detection signals for selector changes';
COMMENT ON COLUMN detection_events.signal_type IS 'Type: hash_change, dom_diff, template_shift';
COMMENT ON COLUMN detection_events.confidence IS 'Confidence score 0-100';

-- ============================================================================
-- REPAIR_OUTCOMES TABLE
-- History of selector repair attempts and results
-- ============================================================================

CREATE TABLE repair_outcomes (
    id VARCHAR(36) NOT NULL,
    selector_id VARCHAR(36) NOT NULL,
    old_selector TEXT NOT NULL,
    new_selector TEXT NOT NULL,
    repair_method VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence INTEGER,
    error_message TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE CASCADE
);

CREATE INDEX idx_selector_timestamp ON repair_outcomes(selector_id, timestamp);
CREATE INDEX idx_repair_status ON repair_outcomes(status);
COMMENT ON TABLE repair_outcomes IS 'Repair attempt history and results';
COMMENT ON COLUMN repair_outcomes.status IS 'Status: success, failed, pending';
COMMENT ON COLUMN repair_outcomes.repair_method IS 'Method used: backup_selector, json_ld, reverse_search, etc';
COMMENT ON COLUMN repair_outcomes.confidence IS 'Confidence score 0-100';

-- ============================================================================
-- API_KEYS TABLE
-- Customer API keys for authentication
-- ============================================================================

CREATE TABLE api_keys (
    id VARCHAR(36) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);

CREATE INDEX idx_key_hash ON api_keys(key_hash);
CREATE INDEX idx_owner_id_api_keys ON api_keys(owner_id);
COMMENT ON TABLE api_keys IS 'Customer API keys (stored as hashes, never plaintext)';
COMMENT ON COLUMN api_keys.owner_id IS 'API key owner/customer ID';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash of the actual key';
COMMENT ON COLUMN api_keys.is_revoked IS 'Revocation status';

-- ============================================================================
-- ALEMBIC VERSION TABLE
-- Tracks which migrations have been applied
-- ============================================================================

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL,
    PRIMARY KEY (version_num)
);

-- ============================================================================
-- FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Sites (1) ---> (N) Selectors
--   Cascade delete: removing a site deletes all its selectors

-- Sites (1) ---> (N) DetectionEvents
--   Cascade delete: removing a site deletes all its detection events

-- Selectors (1) ---> (N) DetectionEvents
--   Cascade delete: removing a selector deletes associated detections

-- Selectors (1) ---> (N) RepairOutcomes
--   Cascade delete: removing a selector deletes associated repairs

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get all active sites for a customer
-- SELECT * FROM sites WHERE owner_id = 'customer-123' AND is_active = true;

-- Get current selectors for a site
-- SELECT * FROM selectors WHERE site_id = 'site-123' AND is_current = true;

-- Get recent detection events (last 7 days)
-- SELECT * FROM detection_events
--   WHERE site_id = 'site-123'
--   AND detected_at >= NOW() - INTERVAL '7 days'
--   ORDER BY detected_at DESC;

-- Get failed repairs that need investigation
-- SELECT * FROM repair_outcomes
--   WHERE status = 'failed'
--   ORDER BY timestamp DESC;

-- Get successful repairs for a selector
-- SELECT * FROM repair_outcomes
--   WHERE selector_id = 'selector-123'
--   AND status = 'success'
--   ORDER BY timestamp DESC;

-- Get detection statistics for a site
-- SELECT
--   signal_type,
--   COUNT(*) as count,
--   AVG(confidence) as avg_confidence
-- FROM detection_events
--   WHERE site_id = 'site-123'
--   GROUP BY signal_type;
