import type { Metadata } from 'next';
import { Timeline } from '@/components/changelog/timeline';
import { Footer } from '@/components/landing/footer';
import { Nav } from '@/components/landing/nav';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { contributorCount, eras, latestVersion } from '@/lib/changelog';
import { coreDir, readCoreRelease } from '@/lib/changelog-source';
import { fetchGitHubStars, formatStarCount } from '@/lib/github';
import { gitConfig } from '@/lib/shared';

const description =
  'Every open-slide release since the first commit, written up by hand: what changed, why it matters, and who helped.';

export const metadata: Metadata = {
  title: 'Changelog',
  description,
  alternates: { canonical: '/changelog' },
  openGraph: { title: 'Changelog — open-slide', description, url: '/changelog' },
};

const rawChangelog = `https://github.com/${gitConfig.owner}/${gitConfig.repo}/blob/${gitConfig.branch}/packages/core/CHANGELOG.md`;

export default async function ChangelogPage() {
  const stars = await fetchGitHubStars();
  const githubStars = stars !== null ? formatStarCount(stars) : null;

  const { releaseCount } = readCoreRelease(coreDir);
  const stats = [
    { value: `v${latestVersion}`, label: 'Latest release' },
    { value: String(releaseCount), label: 'Releases' },
    { value: String(contributorCount), label: 'Contributors' },
    { value: 'Apr 19, 2026', label: 'First commit' },
  ];

  return (
    <>
      <Nav githubStars={githubStars} />
      <ScrollReveal />
      <main className="relative flex-1">
        <div className="mx-auto w-full max-w-[800px] px-6 sm:px-8">
          <section className="pt-20 pb-16 sm:pt-28 sm:pb-24">
            <p className="eyebrow rise">Changelog</p>
            <h1
              className="rise mt-4 text-balance text-[44px] font-medium leading-[1.02] tracking-[-0.04em] text-[color:var(--color-text)] sm:text-[60px]"
              style={{ animationDelay: '80ms' }}
            >
              Every release, written up.
            </h1>
            <p
              className="rise mt-6 max-w-[56ch] text-pretty text-[17px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[18px]"
              style={{ animationDelay: '160ms' }}
            >
              What changed in open-slide since the first commit, one minor version at a time. Patch
              fixes are folded into the release they belong to.
            </p>

            <dl
              className="rise mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[color:var(--color-rule-soft)] shadow-[var(--shadow-edge)] sm:grid-cols-4"
              style={{ animationDelay: '240ms' }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 bg-[color:var(--color-panel)] px-4 py-4"
                >
                  <dt className="caption order-2">{stat.label}</dt>
                  <dd className="nums order-1 font-[family-name:var(--font-mono)] text-[17px] font-medium text-[color:var(--color-text)]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p
              className="rise mt-5 text-[13px] text-[color:var(--color-muted)]"
              style={{ animationDelay: '300ms' }}
            >
              Looking for every line item?{' '}
              <a
                href={rawChangelog}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--color-text-soft)] underline decoration-[color:var(--color-rule)] underline-offset-4 transition-colors hover:text-[color:var(--color-text)]"
              >
                Read the raw CHANGELOG.md
              </a>
            </p>
          </section>

          <div className="pb-24 sm:pb-32">
            <Timeline eras={eras} latest={latestVersion} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
