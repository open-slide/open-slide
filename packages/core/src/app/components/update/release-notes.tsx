import { useState } from 'react';
import { renderInline } from '@/components/note-markdown';
import { parseInline } from '@/lib/note-markdown';
import { useLocale } from '@/lib/use-locale';
import type { Release, ReleaseChange } from '@/lib/use-update';
import { cn } from '@/lib/utils';

const REPO_URL = 'https://github.com/open-slide/open-slide';

export function ReleaseCover({ src, className }: { src: string; className?: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  if (status === 'failed') return null;
  return (
    <div
      className={cn(
        'relative aspect-[12/5] overflow-hidden bg-muted',
        status === 'loading' && 'animate-pulse motion-reduce:animate-none',
        className,
      )}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('failed')}
        className={cn(
          'size-full object-cover transition-opacity duration-300',
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
        <div className="aspect-[12/5] animate-pulse rounded-[8px] bg-muted motion-reduce:animate-none" />
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
  const groups: { label: string; changes: ReleaseChange[] }[] = [
    { label: t.update.breaking, changes: release.changes.filter((c) => c.type === 'major') },
    { label: t.update.features, changes: release.changes.filter((c) => c.type === 'minor') },
    { label: t.update.fixes, changes: release.changes.filter((c) => c.type === 'patch') },
  ];

  return (
    <section className="flex flex-col gap-4">
      {withCover && release.image && (
        <ReleaseCover src={release.image} className="rounded-[8px] ring-1 ring-foreground/[0.06]" />
      )}
      <div className="flex items-baseline gap-2.5">
        <span className="folio shrink-0 rounded-[4px] border border-hairline px-1.5 py-0.5 text-foreground/80">
          v{release.version}
        </span>
        <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight">
          {release.title}
        </h3>
      </div>
      {groups.map(
        (group) =>
          group.changes.length > 0 && (
            <div key={group.label} className="flex flex-col gap-2">
              <span className="eyebrow text-[10.5px]">{group.label}</span>
              <ul className="flex flex-col gap-2.5">
                {group.changes.map((change) => (
                  <ChangeItem key={change.text} change={change} />
                ))}
              </ul>
            </div>
          ),
      )}
    </section>
  );
}

function ChangeItem({ change }: { change: ReleaseChange }) {
  return (
    <li className="relative pl-3.5 text-[13px] leading-relaxed text-foreground/85">
      <span
        aria-hidden
        className={cn(
          'absolute top-[0.6em] left-0 size-1.5 rounded-full',
          change.type === 'patch' ? 'bg-foreground/25' : 'bg-brand',
        )}
      />
      {renderInline(parseInline(change.text))}
      {(change.pr || change.author) && (
        <span className="ml-1.5 inline-flex gap-1.5 text-[11.5px] text-muted-foreground">
          {change.pr && (
            <a
              href={`${REPO_URL}/pull/${change.pr}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              #{change.pr}
            </a>
          )}
          {change.author && (
            <a
              href={`https://github.com/${change.author}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              @{change.author}
            </a>
          )}
        </span>
      )}
    </li>
  );
}
