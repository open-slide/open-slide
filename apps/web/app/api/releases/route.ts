import { coreReleases } from '@/lib/releases';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(
    { package: '@open-slide/core', releases: coreReleases },
    { headers: { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=86400' } },
  );
}
