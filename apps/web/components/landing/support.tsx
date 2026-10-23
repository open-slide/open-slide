import { Coffee } from 'lucide-react';
import { Container } from './frame';

export function Support() {
  return (
    <section id="support">
      <Container className="pb-24 sm:pb-32">
        <div
          data-reveal
          className="flex flex-col items-start gap-8 rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] p-8 sm:p-10 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col gap-3">
            <span className="eyebrow">Support</span>
            <h2 className="text-balance text-[24px] font-medium leading-[1.15] tracking-[-0.02em] text-[color:var(--color-text)] sm:text-[28px]">
              Keep open-slide free and independent.
            </h2>
            <p className="max-w-[52ch] text-pretty text-[15px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[16px]">
              If open-slide has been useful to you, consider buying a coffee. It helps keep new
              features and fixes coming.
            </p>
          </div>

          <a
            href="https://buymeacoffee.com/1weiho"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[color:var(--color-text)] px-5 text-[14.5px] font-medium text-[color:var(--color-ink)] hover:opacity-85"
          >
            <Coffee aria-hidden className="size-4" />
            Buy me a coffee
          </a>
        </div>
      </Container>
    </section>
  );
}
