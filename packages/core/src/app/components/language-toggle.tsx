import { Languages } from 'lucide-react';
import { IconTooltip, MenuTooltipTrigger } from '@/components/icon-tooltip';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALE_OPTIONS, type LocaleId, setLocale } from '@/lib/locale-store';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const t = useLocale();

  return (
    <DropdownMenu>
      <IconTooltip label={t.languageToggle.title}>
        <DropdownMenuTrigger
          render={
            <MenuTooltipTrigger
              type="button"
              aria-label={t.languageToggle.toggleAria}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            />
          }
        >
          <Languages className="size-3.5" />
        </DropdownMenuTrigger>
      </IconTooltip>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuRadioGroup
          value={t.id}
          onValueChange={(value) => setLocale(value as LocaleId)}
        >
          {LOCALE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id} closeOnClick>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
