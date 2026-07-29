import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  try {
    log.info('Fetching API keys statistics');

    const stats = {
      totalCalls: 45231,
      lastKeyUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    };

    log.info(stats, 'Successfully fetched API keys statistics');
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    log.error({ error }, 'Error fetching API keys statistics');
    return NextResponse.json(
      {
        error: 'Failed to fetch API keys statistics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
