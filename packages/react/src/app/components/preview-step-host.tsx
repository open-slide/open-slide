import { type ReactNode, useRef } from 'react';
import { type StepController, StepHost } from '../lib/step-context';

export function PreviewStepHost({ revealed, children }: { revealed: number; children: ReactNode }) {
  const noopControllerRef = useRef<StepController | null>(null);
  return (
    <StepHost
      isActivePage={false}
      entryDirection="jump"
      controllerRef={noopControllerRef}
      controlledRevealed={revealed}
    >
      {children}
    </StepHost>
  );
}
