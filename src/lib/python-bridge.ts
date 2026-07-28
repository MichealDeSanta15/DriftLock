/**
 * Bridge to call Python backend detection and repair logic.
 *
 * This module provides TypeScript wrappers for the Python backend functions.
 * It supports two modes:
 * 1. HTTP bridge (FastAPI server running on localhost:8000)
 * 2. Child process (spawn Python directly)
 *
 * Set PYTHON_BRIDGE_MODE=http or subprocess in .env
 */

import axios from "axios";
import { spawn } from "child_process";
import { logger } from "./logger";

export interface DetectionResult {
  detected: boolean;
  confidence: number;
  change_type: string;
  details?: {
    strategies?: Record<string, any>;
    current_script_hashes?: Record<string, string>;
    pages_checked?: number;
  };
}

export interface RepairResult {
  success: boolean;
  old_selector: string | null;
  new_selector: string | null;
  method: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface Snapshot {
  script_hashes: Record<string, string>;
  pages: Record<string, string>;
}

const BRIDGE_MODE = process.env.PYTHON_BRIDGE_MODE || "http";
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
const PYTHON_TIMEOUT = 30000; // 30 seconds

/**
 * Detect website changes using Python backend.
 *
 * @param siteUrl - URL of the website to check
 * @param oldSnapshot - Previous snapshot for comparison (optional)
 * @param pageUrls - List of page URLs to check for template shifts (optional)
 * @returns Detection result with change type and confidence
 */
export async function detectChanges(
  siteUrl: string,
  oldSnapshot?: Snapshot,
  pageUrls?: string[]
): Promise<DetectionResult> {
  if (BRIDGE_MODE === "http") {
    return detectChangesHTTP(siteUrl, oldSnapshot, pageUrls);
  } else {
    return detectChangesSubprocess(siteUrl, oldSnapshot, pageUrls);
  }
}

/**
 * Create a snapshot of the current website state.
 *
 * @param siteUrl - URL of the website
 * @param pageUrls - List of page URLs to snapshot (optional)
 * @returns Snapshot with script hashes and page content
 */
export async function createSnapshot(
  siteUrl: string,
  pageUrls?: string[]
): Promise<Snapshot> {
  if (BRIDGE_MODE === "http") {
    return createSnapshotHTTP(siteUrl, pageUrls);
  } else {
    return createSnapshotSubprocess(siteUrl, pageUrls);
  }
}

/**
 * Repair a broken selector using Python backend.
 *
 * @param params - Repair parameters
 * @returns Repair result with new selector and method used
 */
export async function repairSelector(params: {
  site_url: string;
  old_selector: string;
  old_html: string;
  new_html: string;
  backup_selectors?: string[];
}): Promise<RepairResult> {
  if (BRIDGE_MODE === "http") {
    return repairSelectorHTTP(params);
  } else {
    return repairSelectorSubprocess(params);
  }
}

/**
 * HTTP-based detection (calls FastAPI backend).
 */
async function detectChangesHTTP(
  siteUrl: string,
  oldSnapshot?: Snapshot,
  pageUrls?: string[]
): Promise<DetectionResult> {
  try {
    const response = await axios.post(
      `${PYTHON_API_URL}/detect`,
      {
        site_url: siteUrl,
        old_snapshot: oldSnapshot,
        page_urls: pageUrls,
      },
      { timeout: PYTHON_TIMEOUT }
    );

    return response.data;
  } catch (error) {
    logger.error(
      { error, siteUrl },
      "Detection HTTP request failed"
    );
    throw error;
  }
}

/**
 * HTTP-based snapshot creation.
 */
async function createSnapshotHTTP(
  siteUrl: string,
  pageUrls?: string[]
): Promise<Snapshot> {
  try {
    const response = await axios.post(
      `${PYTHON_API_URL}/snapshot`,
      {
        site_url: siteUrl,
        page_urls: pageUrls,
      },
      { timeout: PYTHON_TIMEOUT }
    );

    return response.data;
  } catch (error) {
    logger.error(
      { error, siteUrl },
      "Snapshot HTTP request failed"
    );
    throw error;
  }
}

/**
 * HTTP-based selector repair.
 */
async function repairSelectorHTTP(params: any): Promise<RepairResult> {
  try {
    const response = await axios.post(
      `${PYTHON_API_URL}/repair`,
      params,
      { timeout: PYTHON_TIMEOUT }
    );

    return response.data;
  } catch (error) {
    logger.error(
      { error, selectorId: params.old_selector },
      "Repair HTTP request failed"
    );
    throw error;
  }
}

/**
 * Subprocess-based detection (spawns Python script directly).
 * Falls back if HTTP unavailable.
 */
async function detectChangesSubprocess(
  siteUrl: string,
  oldSnapshot?: Snapshot,
  pageUrls?: string[]
): Promise<DetectionResult> {
  try {
    const result = await runPython("backend/scripts/detect.py", {
      site_url: siteUrl,
      old_snapshot: oldSnapshot,
      page_urls: pageUrls,
    });

    return result as DetectionResult;
  } catch (error) {
    logger.error(
      { error, siteUrl },
      "Detection subprocess failed"
    );
    throw error;
  }
}

/**
 * Subprocess-based snapshot creation.
 */
async function createSnapshotSubprocess(
  siteUrl: string,
  pageUrls?: string[]
): Promise<Snapshot> {
  try {
    const result = await runPython("backend/scripts/snapshot.py", {
      site_url: siteUrl,
      page_urls: pageUrls,
    });

    return result as Snapshot;
  } catch (error) {
    logger.error(
      { error, siteUrl },
      "Snapshot subprocess failed"
    );
    throw error;
  }
}

/**
 * Subprocess-based selector repair.
 */
async function repairSelectorSubprocess(params: any): Promise<RepairResult> {
  try {
    const result = await runPython("backend/scripts/repair.py", params);

    return result as RepairResult;
  } catch (error) {
    logger.error(
      { error, selector: params.old_selector },
      "Repair subprocess failed"
    );
    throw error;
  }
}

/**
 * Helper to run Python scripts via subprocess.
 */
function runPython(script: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python", [script, JSON.stringify(args)], {
      timeout: PYTHON_TIMEOUT,
    });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 && output) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        reject(
          new Error(
            `Python script failed (code ${code}): ${errorOutput || output}`
          )
        );
      }
    });

    proc.on("error", (error) => {
      reject(error);
    });
  });
}
