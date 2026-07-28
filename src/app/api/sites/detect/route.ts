/**
 * POST /api/sites/detect
 *
 * Detects website changes and repairs broken selectors.
 *
 * Request body:
 * {
 *   "siteUrl": "https://example.com",
 *   "selectorIds": ["sel_1", "sel_2"]
 * }
 *
 * Response:
 * {
 *   "detected": true,
 *   "confidence": 0.87,
 *   "changeType": "script_change",
 *   "repaired": [
 *     {
 *       "selectorId": "sel_1",
 *       "oldSelector": "h1.title",
 *       "newSelector": "h2.product-name",
 *       "method": "backup_selector",
 *       "confidence": 0.95,
 *       "success": true
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import {
  getSelectors,
  getLatestSnapshot,
  getRecentVersions,
  updateSelector,
  createSelectorVersion,
  createChangeLog,
  saveSnapshot,
} from "@/lib/supabase";
import {
  detectChanges,
  repairSelector,
  Snapshot,
  DetectionResult,
  RepairResult,
} from "@/lib/python-bridge";

interface DetectRequest {
  siteUrl: string;
  selectorIds: string[];
}

interface RepairedSelector {
  selectorId: string;
  oldSelector: string | null;
  newSelector: string | null;
  method: string;
  confidence: number;
  success: boolean;
}

interface DetectResponse {
  detected: boolean;
  confidence: number;
  changeType: string;
  repaired: RepairedSelector[];
}

/**
 * Main handler for detection and repair.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  try {
    // Parse request
    const body: DetectRequest = await req.json();
    const { siteUrl, selectorIds } = body;

    log.info(
      { siteUrl, selectorCount: selectorIds?.length },
      "Detection request received"
    );

    // Validate input
    if (!siteUrl) {
      log.warn("Missing siteUrl");
      return NextResponse.json(
        { error: "siteUrl is required" },
        { status: 400 }
      );
    }

    if (!selectorIds || selectorIds.length === 0) {
      log.warn("Empty selectorIds");
      return NextResponse.json(
        { error: "selectorIds must not be empty" },
        { status: 400 }
      );
    }

    // Fetch selectors from database
    const selectors = await getSelectors(selectorIds);

    if (selectors.length === 0) {
      log.warn({ selectorIds }, "No selectors found");
      return NextResponse.json(
        { error: "No selectors found for the provided IDs" },
        { status: 404 }
      );
    }

    log.info(
      { foundCount: selectors.length, requestedCount: selectorIds.length },
      "Selectors fetched"
    );

    // Get old snapshot for comparison
    const oldSnapshot = await getLatestSnapshot(siteUrl);

    if (!oldSnapshot) {
      log.info(
        { siteUrl },
        "No previous snapshot found, creating initial snapshot"
      );
      return NextResponse.json(
        {
          detected: false,
          confidence: 0,
          changeType: "no_baseline",
          repaired: [],
        },
        { status: 200 }
      );
    }

    log.info(
      { snapshotId: oldSnapshot.id, age: oldSnapshot.created_at },
      "Previous snapshot found"
    );

    // Detect changes
    let detectionResult: DetectionResult;
    try {
      detectionResult = await detectChanges(siteUrl, oldSnapshot.data);
      log.info(
        {
          detected: detectionResult.detected,
          confidence: detectionResult.confidence,
          changeType: detectionResult.change_type,
        },
        "Detection completed"
      );
    } catch (error) {
      log.error({ error }, "Detection failed");
      return NextResponse.json(
        {
          error: "Detection failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // If no changes detected, return early
    if (!detectionResult.detected) {
      log.info("No changes detected");

      return NextResponse.json(
        {
          detected: false,
          confidence: detectionResult.confidence,
          changeType: detectionResult.change_type,
          repaired: [],
        } as DetectResponse,
        { status: 200 }
      );
    }

    // Fetch new HTML
    let newHtml: string;
    try {
      const response = await fetch(siteUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; DriftLock/1.0; +https://driftlock.dev)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      newHtml = await response.text();
      log.info({ siteUrl, htmlLength: newHtml.length }, "New HTML fetched");
    } catch (error) {
      log.error({ error, siteUrl }, "Failed to fetch new HTML");
      return NextResponse.json(
        {
          error: "Failed to fetch website",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Get old HTML from snapshot
    const oldHtml = oldSnapshot.data.pages?.[siteUrl];
    if (!oldHtml) {
      log.warn({ siteUrl }, "Old HTML not found in snapshot");
      return NextResponse.json(
        {
          error: "Old HTML not found in snapshot",
        },
        { status: 400 }
      );
    }

    // Repair each selector
    const repaired: RepairedSelector[] = [];
    let repairErrors = 0;

    for (const selector of selectors) {
      log.info(
        { selectorId: selector.id, selector: selector.selector_key },
        "Starting repair attempt"
      );

      try {
        // Get recent versions to use as backups
        const versions = await getRecentVersions(selector.id, 3);
        const backupSelectors = versions
          .map((v) => v.selector_value)
          .filter((v) => v !== selector.selector_key);

        log.debug({ selectorId: selector.id, backupCount: backupSelectors.length }, "Backup selectors ready");

        // Attempt repair
        let repairResult: RepairResult;
        try {
          repairResult = await repairSelector({
            site_url: siteUrl,
            old_selector: selector.selector_key,
            old_html: oldHtml,
            new_html: newHtml,
            backup_selectors: backupSelectors,
          });

          log.info(
            {
              selectorId: selector.id,
              success: repairResult.success,
              method: repairResult.method,
              confidence: repairResult.confidence,
            },
            "Repair attempt completed"
          );
        } catch (repairError) {
          log.error(
            { selectorId: selector.id, error: repairError },
            "Repair attempt failed with error"
          );

          repairErrors++;

          // Log failed repair
          await createChangeLog({
            selector_id: selector.id,
            old_selector: selector.selector_key,
            new_selector: null,
            detection_method: detectionResult.change_type,
            repair_method: "error",
            detection_timestamp: new Date().toISOString(),
            repair_status: "failed",
            error_message: repairError instanceof Error ? repairError.message : String(repairError),
          });

          repaired.push({
            selectorId: selector.id,
            oldSelector: selector.selector_key,
            newSelector: null,
            method: "error",
            confidence: 0,
            success: false,
          });

          continue;
        }

        repaired.push({
          selectorId: selector.id,
          oldSelector: repairResult.old_selector,
          newSelector: repairResult.new_selector,
          method: repairResult.method,
          confidence: repairResult.confidence,
          success: repairResult.success,
        });

        // Update database if repair successful
        if (repairResult.success && repairResult.new_selector) {
          try {
            const nextVersion =
              versions.length > 0
                ? Math.max(...versions.map((v) => v.version_number)) + 1
                : 1;

            // Create new version
            await createSelectorVersion({
              selector_id: selector.id,
              selector_value: repairResult.new_selector,
              version_number: nextVersion,
              is_backup: false,
              confidence_score: Math.round(repairResult.confidence * 100),
            });

            // Update selector
            await updateSelector(selector.id, {
              selector_key: repairResult.new_selector,
              is_current: true,
              repair_count: selector.repair_count + 1,
            });

            // Log successful repair
            await createChangeLog({
              selector_id: selector.id,
              old_selector: repairResult.old_selector,
              new_selector: repairResult.new_selector,
              detection_method: detectionResult.change_type,
              repair_method: repairResult.method,
              detection_timestamp: new Date().toISOString(),
              repair_timestamp: new Date().toISOString(),
              repair_status: "success",
              validation_score: Math.round(repairResult.confidence * 100),
            });

            log.info(
              {
                selectorId: selector.id,
                oldSelector: repairResult.old_selector,
                newSelector: repairResult.new_selector,
                method: repairResult.method,
              },
              "Selector successfully repaired and updated in database"
            );
          } catch (dbError) {
            log.error(
              { selectorId: selector.id, error: dbError },
              "Failed to update database after successful repair"
            );
            repairErrors++;
          }
        } else {
          // Log failed repair
          try {
            await createChangeLog({
              selector_id: selector.id,
              old_selector: repairResult.old_selector,
              new_selector: null,
              detection_method: detectionResult.change_type,
              repair_method: repairResult.method,
              detection_timestamp: new Date().toISOString(),
              repair_status: "failed",
            });

            log.info(
              { selectorId: selector.id, method: repairResult.method },
              "Repair failed, logged to change log"
            );
          } catch (logError) {
            log.error(
              { selectorId: selector.id, error: logError },
              "Failed to log failed repair"
            );
          }
        }
      } catch (error) {
        log.error(
          { selectorId: selector.id, error },
          "Unexpected error during repair"
        );

        repairErrors++;

        repaired.push({
          selectorId: selector.id,
          oldSelector: selector.selector_key,
          newSelector: null,
          method: "error",
          confidence: 0,
          success: false,
        });
      }
    }

    // Save new snapshot
    try {
      const newSnapshot: Snapshot = {
        script_hashes: detectionResult.details?.current_script_hashes || {},
        pages: {
          [siteUrl]: newHtml,
        },
      };

      await saveSnapshot(siteUrl, newSnapshot);
      log.info({ siteUrl }, "New snapshot saved");
    } catch (error) {
      log.error({ error, siteUrl }, "Failed to save new snapshot");
    }

    // Prepare response
    const response: DetectResponse = {
      detected: detectionResult.detected,
      confidence: detectionResult.confidence,
      changeType: detectionResult.change_type,
      repaired,
    };

    log.info(
      {
        detected: response.detected,
        repairedCount: repaired.filter((r) => r.success).length,
        failedCount: repairErrors,
      },
      "Detection and repair completed successfully"
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    log.error({ error }, "Unexpected error in detect endpoint");

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
