import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

function generateAPIKey(): string {
  const prefix = 'dlk_';
  const randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 24);
  return prefix + randomPart;
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  try {
    log.info('Fetching API keys');

    const keys = [
      {
        id: 'key_1',
        name: 'Production API Key',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        revoked: false,
      },
      {
        id: 'key_2',
        name: 'Development API Key',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        revoked: false,
      },
    ];

    log.info({ count: keys.length }, 'Successfully fetched API keys');
    return NextResponse.json({ keys }, { status: 200 });
  } catch (error) {
    log.error({ error }, 'Error fetching API keys');
    return NextResponse.json(
      {
        error: 'Failed to fetch API keys',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  try {
    const { name } = await req.json();
    log.info({ name }, 'Generating new API key');

    if (!name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    const key = generateAPIKey();
    const keyId = `key_${crypto.randomUUID()}`;

    log.info({ keyId }, 'API key generated successfully');
    return NextResponse.json({ key, keyId, name, createdAt: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    log.error({ error }, 'Error generating API key');
    return NextResponse.json(
      {
        error: 'Failed to generate API key',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
