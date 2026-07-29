/**
 * POST /api/sites/detect
 *
 * Proxies to the Python backend, which runs detection against the site's
 * stored baseline snapshot and, if a change is found, attempts to repair
 * its current selector.
 *
 * Request body:
 * { "site_id": "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);
  const { site_id: siteId } = await req.json();

  if (!siteId) {
    return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
  }

  const backendUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  try {
    log.info({ siteId }, 'Forwarding detection request to Python backend');

    const backendResponse = await fetch(`${backendUrl}/api/sites/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: siteId }),
    });

    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      log.error({ siteId, status: backendResponse.status, data }, 'Backend detection failed');
      return NextResponse.json(
        { error: data.detail || 'Detection failed', details: data },
        { status: backendResponse.status }
      );
    }

    log.info({ siteId, detected: data.detected }, 'Detection completed');
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    log.error({ siteId, error }, 'Failed to reach Python backend');
    return NextResponse.json(
      {
        error: 'Failed to reach detection backend',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
