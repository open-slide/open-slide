'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

const repoUrl = 'https://github.com/open-slide/open-slide';

export function CtaRow({ source = 'hero' }: { source?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => posthog.capture('desktop_cta_clicked', { cta: 'github', source })}
        className="cta-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-medium"
      >
        <GitHubMark />
        Watch the repo
        <span aria-hidden className="cta-arrow cta-arrow-up">
          ↗
        </span>
      </a>
      <Link
        href="/docs"
        onClick={() => posthog.capture('desktop_cta_clicked', { cta: 'docs', source })}
        className="cta-ghost inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-medium"
      >
        Use it in the browser today
        <span aria-hidden className="cta-arrow">
          →
        </span>
      </Link>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
