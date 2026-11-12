import type { CSSProperties, ReactNode } from 'react';
import { type SlideNarrationOptions, useSlideNarration } from '../lib/use-slide-narration.ts';

export type SlideAudioProps = SlideNarrationOptions & {
  /**
   * Whether to render an accessible play/pause control button. Default: false.
   */
  showControls?: boolean;
  /**
   * Optional custom label or render function for the control button.
   */
  children?: ReactNode | ((state: { isPlaying: boolean; engine: string }) => ReactNode);
  /**
   * Optional inline style for the control button container.
   */
  style?: CSSProperties;
  /**
   * Optional CSS class name for the control button container.
   */
  className?: string;
};

export function SlideAudio({
  showControls = false,
  children,
  style,
  className,
  ...narrationOptions
}: SlideAudioProps) {
  const narration = useSlideNarration(narrationOptions);

  if (!showControls && !children) {
    return null;
  }

  const content =
    typeof children === 'function'
      ? children({
          isPlaying: narration.isPlaying,
          engine: narration.engine,
        })
      : (children ?? (narration.isPlaying ? 'Pause Narration' : 'Play Narration'));

  return (
    <button
      type="button"
      onClick={narration.toggle}
      style={style}
      className={className}
      aria-label={narration.isPlaying ? 'Pause slide narration' : 'Play slide narration'}
      data-osd-interactive
    >
      {content}
    </button>
  );
}
