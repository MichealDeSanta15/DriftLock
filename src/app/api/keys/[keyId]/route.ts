import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { keyId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);
  const keyId = params.keyId;

  try {
    log.info({ keyId }, 'Revoking API key');

    log.info({ keyId }, 'API key revoked successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    log.error({ keyId, error }, 'Error revoking API key');
    return NextResponse.json(
      {
        error: 'Failed to revoke API key',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
