import { useEffect, useState } from 'react';
import { usePanelMount } from '@/components/panel/panel-shell';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

const VISIBLE_MS = 1800;

type Props = {
  shownAt: number;
};

export function PresentLastSlideHint({ shownAt }: Props) {
  const t = useLocale();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!shownAt) return;
    setOpen(true);
    const id = window.setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [shownAt]);
  const { mounted, animVisible } = usePanelMount(open);
  if (!mounted) return null;
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none absolute bottom-10 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-3.5 py-1.5 text-[12px] text-white/85 shadow-lg backdrop-blur-md motion-safe:transition-[opacity,translate]',
        animVisible
          ? 'opacity-100 motion-safe:duration-200'
          : 'translate-y-1 opacity-0 motion-safe:duration-200',
      )}
    >
      {t.present.lastSlideHint}
    </div>
  );
}
