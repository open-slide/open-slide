import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { renderInline } from '@/components/note-markdown';
import { parseInline } from '@/lib/note-markdown';
import { useLocale } from '@/lib/use-locale';
import type { ReleaseCover as Cover, Release } from '@/lib/use-update';
import { cn } from '@/lib/utils';

export function ReleaseCover({ cover, className }: { cover: Cover; className?: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  if (status === 'failed') return null;
  return (
    <div
      style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
      className={cn(
        'relative overflow-hidden bg-muted',
        status === 'loading' && 'animate-pulse motion-reduce:animate-none',
        className,
      )}
    >
      <img
        src={cover.url}
        alt={cover.alt}
        draggable={false}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('failed')}
        className={cn(
          'size-full object-cover object-top transition-opacity duration-300',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}

export function ReleaseNotes({ releases }: { releases: Release[] | null | undefined }) {
  const t = useLocale();

  if (releases === undefined) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <div className="aspect-[3/2] animate-pulse rounded-[8px] bg-muted motion-reduce:animate-none" />
        <div className="relative h-px w-40 overflow-hidden bg-hairline">
          <span
            aria-hidden
            className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
          />
        </div>
      </div>
    );
  }

  if (!releases?.length) {
    return <p className="py-6 text-[13px] text-muted-foreground">{t.update.notesUnavailable}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {releases.map((release, i) => (
        <ReleaseSection key={release.version} release={release} withCover={i === 0} />
      ))}
    </div>
  );
}

function ReleaseSection({ release, withCover }: { release: Release; withCover: boolean }) {
  const t = useLocale();

  return (
    <section className="flex flex-col gap-4">
      {withCover && release.image && (
        <ReleaseCover
          key={release.image.url}
          cover={release.image}
          className="rounded-[8px] ring-1 ring-foreground/[0.06]"
        />
      )}
      <div className="flex items-baseline gap-2.5">
        <span className="folio shrink-0 rounded-[4px] border border-hairline px-1.5 py-0.5 text-foreground/80">
          v{release.version}
        </span>
        <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight">
          {release.url ? (
            <a
              href={release.url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-baseline gap-1 hover:underline"
            >
              {release.title}
              <ArrowUpRight
                className="size-3 self-center text-muted-foreground group-hover:text-foreground"
                aria-hidden
              />
            </a>
          ) : (
            release.title
          )}
        </h3>
      </div>
      {release.summary && (
        <p className="text-[13px] leading-relaxed text-foreground/85">
          {renderInline(parseInline(release.summary))}
        </p>
      )}
      {release.highlights.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {release.highlights.map((highlight) => (
            <Item key={highlight} text={highlight} accent />
          ))}
        </ul>
      )}
      {release.patches.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="eyebrow text-[10.5px]">{t.update.fixes}</span>
          <ul className="flex flex-col gap-2.5">
            {release.patches.map((patch) => (
              <Item key={patch.version} text={patch.note} label={`v${patch.version}`} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Item({ text, label, accent }: { text: string; label?: string; accent?: boolean }) {
  return (
    <li className="relative pl-3.5 text-[13px] leading-relaxed text-foreground/85">
      <span
        aria-hidden
        className={cn(
          'absolute top-[0.6em] left-0 size-1.5 rounded-full',
          accent ? 'bg-brand' : 'bg-foreground/25',
        )}
      />
      {label && <span className="folio mr-1.5 text-[11px] text-muted-foreground">{label}</span>}
      {renderInline(parseInline(text))}
    </li>
  );
}
