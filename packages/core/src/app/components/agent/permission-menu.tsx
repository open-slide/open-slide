import { CheckCheck, ChevronDown, FilePen, Hand, ShieldCheck, ShieldOff } from 'lucide-react';
import type { ComponentType } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  auto: ShieldCheck,
  manual: Hand,
  acceptEdits: FilePen,
  autoApprove: CheckCheck,
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
    m === 'manual' && providerId === 'codex'
      ? t.agent.permissionManualCodex
      : t.agent.permissionHints[m];

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
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[280px] p-1.5">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(next) => {
            if (isAgentPermissionMode(next)) setPermissionMode(next);
          }}
        >
          <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-[11px] font-medium text-muted-foreground">
            {t.agent.permissionMode}
          </DropdownMenuLabel>
          {AGENT_PERMISSION_MODES.map((m) => {
            const ItemIcon = MODE_ICONS[m];
            return (
              <DropdownMenuRadioItem
                key={m}
                value={m}
                closeOnClick
                className={cn(
                  'items-start',
                  m === 'fullAccess' && 'data-[checked]:text-destructive',
                )}
              >
                <ItemIcon
                  className={cn(
                    'mt-px size-3.5',
                    m === 'fullAccess' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{t.agent.permissionModes[m]}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {hint(m)}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
