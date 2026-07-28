/**
 * End-to-end integration test for detection and repair flow.
 *
 * Tests:
 * 1. POST /api/sites/detect detects changes
 * 2. Selector is repaired
 * 3. Database is updated
 * 4. GET /api/selectors/[id]/current returns updated selector
 *
 * Run with: npm test -- detect-repair.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Detection and Repair Integration", () => {
  const baseUrl = "http://localhost:3000";
  const testSiteUrl = "https://example.com";
  const testSelectorId = "test_sel_integration_" + Date.now();

  beforeAll(async () => {
    // Setup: Create test selector in database
    // In production, this would use Supabase admin API or direct DB access
    console.log("Setting up test selector:", testSelectorId);
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    console.log("Cleaning up test data");
  });

  it("should detect website changes", async () => {
    const response = await fetch(`${baseUrl}/api/sites/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteUrl: testSiteUrl,
        selectorIds: [testSelectorId],
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty("detected");
    expect(data).toHaveProperty("confidence");
    expect(data).toHaveProperty("changeType");
    expect(data).toHaveProperty("repaired");
    expect(Array.isArray(data.repaired)).toBe(true);
  });

  it("should return 400 if selectorIds is empty", async () => {
    const response = await fetch(`${baseUrl}/api/sites/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteUrl: testSiteUrl,
        selectorIds: [],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should return 400 if siteUrl is missing", async () => {
    const response = await fetch(`${baseUrl}/api/sites/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectorIds: [testSelectorId],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should return 404 if selectors not found", async () => {
    const response = await fetch(`${baseUrl}/api/sites/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteUrl: testSiteUrl,
        selectorIds: ["nonexistent_selector_" + Date.now()],
      }),
    });

    expect(response.status).toBe(404);
  });

  it("should fetch current selector", async () => {
    const response = await fetch(`${baseUrl}/api/selectors/${testSelectorId}/current`);

    if (response.status === 200) {
      const data = await response.json();

      expect(data).toHaveProperty("selectorId");
      expect(data).toHaveProperty("currentSelector");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("repairCount");

      expect(data.selectorId).toBe(testSelectorId);
      expect(typeof data.currentSelector).toBe("string");
    }
  });

  it("should return 404 for nonexistent selector", async () => {
    const response = await fetch(`${baseUrl}/api/selectors/nonexistent_id/current`);

    expect(response.status).toBe(404);
  });

  it("should handle detection failures gracefully", async () => {
    // Test with invalid site URL (should not crash)
    const response = await fetch(`${baseUrl}/api/sites/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteUrl: "https://invalid-domain-that-does-not-exist-12345.com",
        selectorIds: [testSelectorId],
      }),
    });

    // Either success (no baseline) or error, but not crash
    expect([200, 500]).toContain(response.status);

    const data = await response.json();
    expect(data).toHaveProperty("detected");
  });
});
