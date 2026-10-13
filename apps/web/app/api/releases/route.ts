import { getCoreReleases } from '@/lib/releases';

export const revalidate = 600;

export async function GET() {
  const releases = await getCoreReleases();
  return Response.json(
    { package: '@open-slide/core', releases },
    { headers: { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=86400' } },
  );
}
