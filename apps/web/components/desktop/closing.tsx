import { AppIcon } from './app-icon';
import { CtaRow } from './cta';

export function Closing() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[520px]"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 50% 100%, rgb(254 82 38 / 0.16), transparent 70%)',
        }}
      />
      <div
        data-reveal="stagger"
        className="hairline-top relative mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pt-28 pb-32 text-center sm:px-8 sm:pt-36 sm:pb-44"
      >
        <AppIcon size={72} />
        <h2 className="serif mt-12 text-[60px] leading-[0.98] text-[color:var(--color-text)] sm:text-[104px]">
          Coming <em className="ember-ink">soon.</em>
        </h2>
        <p className="mt-6 max-w-[30rem] text-pretty text-[16px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[17px]">
          We're sanding down the last edges. Watch the repo and you'll hear the moment the first
          build ships.
        </p>
        <div className="mt-10">
          <CtaRow source="closing" />
        </div>
      </div>
    </section>
  );
}
