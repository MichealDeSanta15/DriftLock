import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { getSites as getDbSites } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { type Site as ApiSite } from '@/lib/api';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  try {
    log.info('Fetching sites');

    const dbSites = await getDbSites();

    if (!dbSites || dbSites.length === 0) {
      log.info('No sites found');
      return NextResponse.json({ sites: [] }, { status: 200 });
    }

    // Fetch selectors and their health status for each site
    const sitesWithSelectors: ApiSite[] = await Promise.all(
      dbSites.map(async (site) => {
        const { data: selectors, error: selectorsError } = await supabase
          .from('selectors')
          .select('id, selector_key, is_current')
          .eq('site_id', site.id);

        if (selectorsError) {
          log.warn({ siteId: site.id, error: selectorsError }, 'Error fetching selectors');
        }

        // Get the current selector
        const currentSelector = selectors?.find((s) => s.is_current);
        const selectorId = currentSelector?.id || (selectors?.[0]?.id || 'unknown');

        // Determine site health status based on recent detection events
        const { data: recentEvents, error: eventsError } = await supabase
          .from('change_logs')
          .select('repair_status')
          .eq('selector_id', selectorId)
          .order('detection_timestamp', { ascending: false })
          .limit(1);

        let status: 'working' | 'broken' | 'failed' = 'working';
        let lastRepaired: string | undefined;

        if (!eventsError && recentEvents && recentEvents.length > 0) {
          const lastEvent = recentEvents[0];
          if (lastEvent.repair_status === 'failed') {
            status = 'failed';
          } else if (lastEvent.repair_status === 'success' || lastEvent.repair_status === 'completed') {
            status = 'working';
          }

          // Get the repair timestamp for lastRepaired
          const { data: repairData } = await supabase
            .from('change_logs')
            .select('repair_timestamp')
            .eq('selector_id', selectorId)
            .eq('repair_status', 'success')
            .order('repair_timestamp', { ascending: false })
            .limit(1);

          if (repairData && repairData.length > 0 && repairData[0].repair_timestamp) {
            lastRepaired = repairData[0].repair_timestamp;
          }
        }

        return {
          id: site.id,
          name: site.name,
          url: site.url,
          status,
          lastChecked: site.updated_at,
          selectorId,
          currentSelector: currentSelector?.selector_key || 'Not set',
          lastRepaired,
        };
      })
    );

    log.info({ count: sitesWithSelectors.length }, 'Successfully fetched sites');
    return NextResponse.json({ sites: sitesWithSelectors }, { status: 200 });
  } catch (error) {
    log.error({ error }, 'Error fetching sites');
    return NextResponse.json(
      {
        error: 'Failed to fetch sites',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
