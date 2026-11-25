import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, FilePen, Hand, ShieldCheck, ShieldOff } from 'lucide-react';
import type { ComponentType } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setPermissionMode } from '@/lib/agent/use-agent';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import {
  AGENT_PERMISSION_MODES,
  type AgentPermissionMode,
  type AgentProviderId,
  isAgentPermissionMode,
} from '../../../agent/types';

const MODE_ICONS: Record<AgentPermissionMode, ComponentType<{ className?: string }>> = {
  supervised: Hand,
  acceptEdits: FilePen,
  auto: ShieldCheck,
  fullAccess: ShieldOff,
};

export function PermissionMenu({
  mode,
  providerId,
}: {
  mode: AgentPermissionMode;
  providerId: AgentProviderId | null;
}) {
  const t = useLocale();
  const Icon = MODE_ICONS[mode];
  const hint = (m: AgentPermissionMode) =>
    providerId === 'codex' ? t.agent.permissionHintsCodex[m] : t.agent.permissionHints[m];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`${t.agent.permissionMode}: ${t.agent.permissionModes[mode]}`}
        title={hint(mode)}
        data-permission-mode={mode}
        className={cn(
          'flex h-7 min-w-0 shrink items-center gap-1 rounded-[6px] px-1.5 text-[12px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-muted aria-expanded:text-foreground',
          mode === 'fullAccess' &&
            'text-destructive hover:text-destructive aria-expanded:text-destructive',
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{t.agent.permissionModes[mode]}</span>
        <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-[184px] p-1">
        <Menu.RadioGroup
          value={mode}
          onValueChange={(next) => {
            if (isAgentPermissionMode(next)) setPermissionMode(next);
          }}
        >
          {AGENT_PERMISSION_MODES.map((m) => {
            const ItemIcon = MODE_ICONS[m];
            const danger = m === 'fullAccess';
            return (
              <Menu.RadioItem
                key={m}
                value={m}
                closeOnClick
                title={hint(m)}
                className={cn(
                  'flex h-8 cursor-default items-center gap-2.5 rounded-[5px] px-2 text-[12.5px] outline-none select-none focus:bg-foreground/[0.07] dark:focus:bg-foreground/10',
                  danger && 'text-destructive',
                )}
              >
                <ItemIcon className={cn('size-3.5 shrink-0', !danger && 'text-muted-foreground')} />
                <span className="flex-1 truncate">{t.agent.permissionModes[m]}</span>
                <Menu.RadioItemIndicator className="text-foreground">
                  <Check className="size-3.5" />
                </Menu.RadioItemIndicator>
              </Menu.RadioItem>
            );
          })}
        </Menu.RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
