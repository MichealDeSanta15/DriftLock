/**
 * GET /api/selectors/[selectorId]/current
 *
 * Returns the current active selector for a given selector ID.
 *
 * Response:
 * {
 *   "selectorId": "sel_1",
 *   "currentSelector": "h2.product-name",
 *   "timestamp": "2025-07-28T15:30:00Z",
 *   "lastRepaired": "2025-07-28T14:15:00Z",
 *   "repairCount": 3,
 *   "confidence": 0.95
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import { getSelector, supabase } from "@/lib/supabase";

interface CurrentSelectorResponse {
  selectorId: string;
  currentSelector: string;
  timestamp: string;
  lastRepaired?: string;
  repairCount: number;
  confidence?: number;
}

/**
 * Handler for getting the current selector.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { selectorId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);
  const selectorId = params.selectorId;

  try {
    log.info({ selectorId }, "Current selector request received");

    // Fetch selector
    const selector = await getSelector(selectorId);

    if (!selector) {
      log.warn({ selectorId }, "Selector not found");
      return NextResponse.json(
        { error: "Selector not found" },
        { status: 404 }
      );
    }

    log.debug({ selectorId, selector: selector.selector_key }, "Selector fetched");

    // Fetch latest successful repair
    const { data: changeLogs, error: logsError } = await supabase
      .from("change_logs")
      .select("*")
      .eq("selector_id", selectorId)
      .eq("repair_status", "success")
      .order("repair_timestamp", { ascending: false })
      .limit(1);

    if (logsError) {
      log.error({ selectorId, error: logsError }, "Failed to fetch change logs");
    }

    const lastRepair = changeLogs?.[0];

    log.info(
      {
        selectorId,
        currentSelector: selector.selector_key,
        lastRepaired: lastRepair?.repair_timestamp,
      },
      "Current selector retrieved"
    );

    const response: CurrentSelectorResponse = {
      selectorId,
      currentSelector: selector.selector_key,
      timestamp: selector.updated_at,
      lastRepaired: lastRepair?.repair_timestamp,
      repairCount: selector.repair_count,
      confidence: lastRepair?.validation_score ? lastRepair.validation_score / 100 : undefined,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    log.error({ selectorId, error }, "Error fetching current selector");

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
