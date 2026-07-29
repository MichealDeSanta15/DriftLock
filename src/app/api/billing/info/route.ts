import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  try {
    log.info('Fetching billing information');

    const billingInfo = {
      sitesMonitored: 3,
      apiCallsThisMonth: 45231,
      currentPlan: 'free',
      nextBillingDate: null,
    };

    log.info(billingInfo, 'Successfully fetched billing information');
    return NextResponse.json(billingInfo, { status: 200 });
  } catch (error) {
    log.error({ error }, 'Error fetching billing information');
    return NextResponse.json(
      {
        error: 'Failed to fetch billing information',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
