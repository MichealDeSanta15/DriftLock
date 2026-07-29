import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: { siteId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);
  const siteId = params.siteId;

  try {
    const { name, url } = await req.json();
    log.info({ siteId, name, url }, 'Updating site');

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sites')
      .update({ name, url, updated_at: new Date().toISOString() })
      .eq('id', siteId);

    if (error) {
      log.error({ siteId, error }, 'Failed to update site');
      throw error;
    }

    log.info({ siteId }, 'Site updated successfully');
    return NextResponse.json({ id: siteId, name, url, status: 'working' }, { status: 200 });
  } catch (error) {
    log.error({ siteId, error }, 'Error updating site');
    return NextResponse.json(
      {
        error: 'Failed to update site',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);
  const siteId = params.siteId;

  try {
    log.info({ siteId }, 'Deleting site');

    const { error } = await supabase.from('sites').delete().eq('id', siteId);

    if (error) {
      log.error({ siteId, error }, 'Failed to delete site');
      throw error;
    }

    log.info({ siteId }, 'Site deleted successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    log.error({ siteId, error }, 'Error deleting site');
    return NextResponse.json(
      {
        error: 'Failed to delete site',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
