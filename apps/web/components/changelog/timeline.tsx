import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Era, Patch, Release, ReleaseKind } from '@/lib/changelog';
import { type IndicatorEntry, ReleaseIndicator } from './release-indicator';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));
const formatShortDate = (iso: string) => shortDateFormat.format(new Date(`${iso}T00:00:00Z`));

const kindLabel: Record<ReleaseKind, string> = {
  major: 'Major release',
  feature: 'New feature',
  polish: 'Improvements',
  origin: 'Origin',
};

const isHighlight = (release: Release) => release.kind === 'major' || !!release.shot;
const versionLabel = (release: Release) => `v${release.versionLabel ?? release.version}`;

export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            // biome-ignore lint/suspicious/noArrayIndexKey: split output is static per render
            key={i}
            className="rounded-[4px] border border-[color:var(--color-rule-soft)] bg-[color:var(--color-panel-hi)] px-[0.3em] py-[0.05em] font-[family-name:var(--font-mono)] text-[0.86em] text-[color:var(--color-text)]"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function Timeline({ eras, latest }: { eras: Era[]; latest: string }) {
  const indicatorEntries: IndicatorEntry[] = eras.flatMap((era) =>
    era.releases.map((release) => ({
      id: `v${release.line}`,
      version: versionLabel(release),
      date: formatDate(release.date),
    })),
  );

  return (
    <div className="cl-timeline relative">
      <ReleaseIndicator entries={indicatorEntries} />
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 sm:mb-16">
        <fieldset className="cl-filter inline-flex items-center gap-0.5 rounded-full bg-[color:var(--color-panel)] p-1 shadow-[var(--shadow-edge)]">
          <legend className="sr-only">Show</legend>
          <label>
            <input type="radio" name="cl-filter" value="all" defaultChecked className="sr-only" />
            <span>Everything</span>
          </label>
          <label>
            <input
              id="cl-highlights"
              type="radio"
              name="cl-filter"
              value="highlights"
              className="sr-only"
            />
            <span>Highlights</span>
          </label>
        </fieldset>
        <p className="caption">Newest first</p>
      </div>

      {eras.map((era, eraIndex) => (
        <section key={era.id} aria-labelledby={`era-${era.id}`}>
          <EraHeader era={era} first={eraIndex === 0} />
          {era.releases.map((release, i) => (
            <Entry
              key={release.line}
              release={release}
              latest={latest}
              last={eraIndex === eras.length - 1 && i === era.releases.length - 1}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function EraHeader({ era, first }: { era: Era; first: boolean }) {
  return (
    <div className={`cl-rail relative pb-14 pl-8 sm:pl-12 ${first ? 'cl-rail-start' : 'pt-6'}`}>
      <span aria-hidden className="cl-node cl-node-era" />
      <p className="caption nums mb-3 flex items-center gap-2">
        <span className="normal-case text-[color:var(--color-text)]">{era.label}</span>
        <span aria-hidden>·</span>
        <span>{era.span}</span>
      </p>
      <h2
        id={`era-${era.id}`}
        data-reveal
        className="max-w-[24ch] text-balance text-[26px] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[32px]"
      >
        <span className="text-[color:var(--color-text)]">{era.title}.</span>{' '}
        <span className="text-[color:var(--color-muted)]">{era.blurb}</span>
      </h2>
    </div>
  );
}

function Entry({ release, latest, last }: { release: Release; latest: string; last: boolean }) {
  const major = release.kind === 'major';
  const highlight = isHighlight(release);
  const isLatest = release.version === latest;
  const holdsLatest = isLatest || !!release.patches?.some((patch) => patch.version === latest);
  const label = versionLabel(release);

  return (
    <article
      id={`v${release.line}`}
      data-highlight={highlight ? 'true' : 'false'}
      className="cl-entry relative scroll-mt-24"
    >
      <header className="absolute inset-y-0 right-full mr-10 hidden w-[160px] min-[1200px]:block">
        <div className="cl-gutter-label flex flex-col items-end gap-1.5 pt-[3px] text-right">
          <a
            href={`#v${release.line}`}
            className="nums font-[family-name:var(--font-mono)] text-[15px] font-medium text-[color:var(--color-text)] hover:text-[color:var(--color-accent)]"
          >
            {label}
          </a>
          <time
            dateTime={release.date}
            className="nums text-[13px] text-[color:var(--color-muted)]"
          >
            {formatDate(release.date)}
          </time>
          {isLatest ? <LatestBadge /> : null}
        </div>
      </header>

      <div
        className={`cl-rail relative pl-8 sm:pl-12 ${last ? 'cl-rail-end pb-4' : 'pb-16 sm:pb-24'}`}
      >
        <span
          aria-hidden
          className={`cl-node ${major || holdsLatest ? 'cl-node-accent' : highlight ? 'cl-node-solid' : 'cl-node-hollow'}`}
        />

        <div data-reveal>
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span
              className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ${
                major
                  ? 'bg-[color:color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[color:var(--color-accent)]'
                  : 'bg-[color:var(--color-panel-hi)] text-[color:var(--color-text-soft)] shadow-[var(--shadow-edge)]'
              }`}
            >
              {kindLabel[release.kind]}
            </span>
            <span className="nums flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12.5px] text-[color:var(--color-muted)] min-[1200px]:hidden">
              {label}
              <span aria-hidden>·</span>
              <time dateTime={release.date}>{formatDate(release.date)}</time>
            </span>
            {isLatest ? (
              <span className="min-[1200px]:hidden">
                <LatestBadge />
              </span>
            ) : null}
          </div>

          <h3
            className={`text-balance font-medium tracking-[-0.03em] text-[color:var(--color-text)] ${
              major
                ? 'text-[30px] leading-[1.08] sm:text-[40px]'
                : 'text-[22px] leading-[1.2] sm:text-[25px]'
            }`}
          >
            {release.title}
          </h3>

          {release.summary ? (
            <p
              className={`mt-4 max-w-[62ch] text-pretty text-[color:var(--color-text-soft)] ${
                major ? 'text-[17px] leading-[1.65]' : 'text-[15.5px] leading-[1.65]'
              }`}
            >
              <Rich text={release.summary} />
            </p>
          ) : null}
        </div>

        {release.shot ? (
          <figure data-reveal className="mt-8 sm:mt-10">
            <ImageZoom
              src={release.shot.src}
              alt={release.shot.alt}
              width={release.shot.width}
              height={release.shot.height}
              sizes="(min-width: 800px) 690px, 100vw"
              className="block h-auto w-full rounded-[14px] shadow-[var(--shadow-floating)] ring-1 ring-[color:var(--color-rule-soft)]"
            />
          </figure>
        ) : null}

        {release.highlights?.length ? (
          <ul data-reveal className="mt-7 flex max-w-[64ch] flex-col gap-3">
            {release.highlights.map((item) => (
              <li
                key={item}
                className="flex gap-3.5 text-[15px] leading-[1.6] text-[color:var(--color-text-soft)]"
              >
                <span
                  aria-hidden
                  className={`mt-[0.62em] size-[5px] shrink-0 rounded-full ${
                    major ? 'bg-[color:var(--color-accent)]' : 'bg-[color:var(--color-dim)]'
                  }`}
                />
                <span>
                  <Rich text={item} />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {release.callout ? (
          <div
            data-reveal
            className="mt-8 flex max-w-[64ch] flex-wrap items-center justify-between gap-3 rounded-xl bg-[color:var(--color-panel-hi)] px-4 py-3.5 shadow-[var(--shadow-edge)]"
          >
            <p className="text-[14.5px] text-[color:var(--color-text-soft)]">
              {release.callout.text}
            </p>
            <Arrow href={release.callout.href}>{release.callout.label}</Arrow>
          </div>
        ) : null}

        {release.patches?.length ? <Patches patches={release.patches} latest={latest} /> : null}

        {release.docs || release.contributors?.length ? (
          <div
            data-reveal
            className="mt-8 flex max-w-[64ch] flex-wrap items-center justify-between gap-x-6 gap-y-4"
          >
            {release.contributors?.length ? (
              <Contributors handles={release.contributors} />
            ) : (
              <span />
            )}
            {release.docs ? <Arrow href={release.docs.href}>{release.docs.label}</Arrow> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Patches({ patches, latest }: { patches: Patch[]; latest: string }) {
  const range =
    patches.length > 1 ? `${patches[0].version} – ${patches.at(-1)?.version}` : patches[0].version;
  return (
    <details
      data-reveal
      open={patches.length <= 2 || patches.some((patch) => patch.version === latest)}
      className="cl-patches group mt-8 max-w-[64ch] border-t border-[color:var(--color-rule-soft)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[13.5px] text-[color:var(--color-text-soft)] transition-colors hover:text-[color:var(--color-text)]">
        <span className="flex items-center gap-2.5">
          <span className="font-medium text-[color:var(--color-text)]">
            {patches.length === 1 ? 'Patch release' : `${patches.length} patch releases`}
          </span>
          <span className="nums font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)]">
            {range}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          strokeWidth={1.6}
          className="size-3.5 text-[color:var(--color-muted)] transition-transform duration-300 ease-[var(--ease-out-strong)] group-open:rotate-180"
        />
      </summary>
      <ol className="flex flex-col pb-1">
        {patches.map((patch) => (
          <li
            key={patch.version}
            className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 border-t border-dashed border-[color:var(--color-rule-soft)] py-3 sm:grid-cols-[64px_minmax(0,1fr)_56px]"
          >
            <span className="flex flex-col items-start gap-1.5">
              <span className="nums pt-px font-[family-name:var(--font-mono)] text-[12.5px] text-[color:var(--color-text)]">
                {patch.version}
              </span>
              {patch.version === latest ? <LatestBadge /> : null}
            </span>
            <p className="text-[14px] leading-[1.6] text-[color:var(--color-text-soft)]">
              <Rich text={patch.note} />
            </p>
            <time
              dateTime={patch.date}
              className="nums col-start-2 pt-0.5 text-[12.5px] text-[color:var(--color-muted)] sm:col-start-3 sm:text-right"
            >
              {formatShortDate(patch.date)}
            </time>
          </li>
        ))}
      </ol>
    </details>
  );
}

function Contributors({ handles }: { handles: string[] }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-1.5">
        {handles.map((handle) => (
          <a
            key={handle}
            href={`https://github.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`@${handle}`}
            className="pressable relative rounded-full ring-2 ring-[color:var(--color-ink)] hover:z-10"
          >
            <Image
              src={`https://github.com/${handle}.png?size=64`}
              alt={`@${handle}`}
              width={24}
              height={24}
              unoptimized
              className="block size-6 rounded-full bg-[color:var(--color-panel-hi)]"
            />
          </a>
        ))}
      </div>
      <p className="text-[13px] text-[color:var(--color-muted)]">
        With help from{' '}
        {handles.map((handle, i) => (
          <span key={handle}>
            {i > 0 ? (i === handles.length - 1 ? ' and ' : ', ') : null}
            <a
              href={`https://github.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--color-text-soft)] transition-colors hover:text-[color:var(--color-text)]"
            >
              @{handle}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

function Arrow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[color:var(--color-text)] transition-colors hover:text-[color:var(--color-accent)]"
    >
      {children}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

function LatestBadge() {
  return (
    <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-[color:color-mix(in_oklab,var(--color-accent)_10%,transparent)] px-2 text-[11px] font-medium text-[color:var(--color-accent)]">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--color-accent)] opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--color-accent)]" />
      </span>
      Latest
    </span>
  );
}
