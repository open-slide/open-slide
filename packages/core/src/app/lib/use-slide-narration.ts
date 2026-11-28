import { useCallback, useEffect, useRef, useState } from 'react';

export type SlideNarrationOptions = {
  /**
   * One or more audio URLs to play in priority order (e.g. `['./audio/act-1.mp3', './audio/act-1.m4a']`).
   */
  src?: string | string[];
  /**
   * Text to speak using Web Speech API fallback if audio sources fail or are omitted.
   */
  text?: string;
  /**
   * Speech rate for Web Speech API fallback (0.1 to 10, default: 1.0).
   */
  rate?: number;
  /**
   * Speech pitch for Web Speech API fallback (0 to 2, default: 1.0).
   */
  pitch?: number;
  /**
   * Optional preferred voice name or language prefix (e.g. 'Samantha' or 'en').
   */
  voice?: string;
  /**
   * Whether to automatically start playing when the slide mounts.
   */
  autoPlay?: boolean;
  /**
   * Callback fired when playback completes.
   */
  onEnded?: () => void;
  /**
   * Callback fired when playback starts.
   */
  onPlay?: () => void;
  /**
   * Callback fired when playback is paused.
   */
  onPause?: () => void;
};

export type SlideNarrationResult = {
  isPlaying: boolean;
  engine: 'audio' | 'speech-synthesis' | 'none';
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
};

export function useSlideNarration(options: SlideNarrationOptions = {}): SlideNarrationResult {
  const {
    src,
    text,
    rate = 1.0,
    pitch = 1.0,
    voice,
    autoPlay = false,
    onEnded,
    onPlay,
    onPause,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [engine, setEngine] = useState<'audio' | 'speech-synthesis' | 'none'>('none');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const stop = useCallback(() => {
    setIsPlaying(false);
    setEngine('none');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    onPause?.();
  }, [onPause]);

  const playSpeechSynthesis = useCallback(
    (speechText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsPlaying(false);
        setEngine('none');
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = rate;
      utterance.pitch = pitch;

      if (voice) {
        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find((v) => v.name.includes(voice) || v.lang.startsWith(voice));
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setEngine('speech-synthesis');
        onPlay?.();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setEngine('none');
        onEnded?.();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setEngine('none');
      };

      window.speechSynthesis.speak(utterance);
    },
    [rate, pitch, voice, onPlay, onEnded],
  );

  const play = useCallback(() => {
    const sources = Array.isArray(src) ? src : src ? [src] : [];

    if (sources.length === 0) {
      if (text) {
        playSpeechSynthesis(text);
      }
      return;
    }

    const trySource = (index: number) => {
      if (index >= sources.length) {
        if (text) {
          playSpeechSynthesis(text);
        } else {
          setIsPlaying(false);
          setEngine('none');
        }
        return;
      }

      const audio = new Audio(sources[index]);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setEngine('audio');
        onPlay?.();
      };

      audio.onended = () => {
        setIsPlaying(false);
        setEngine('none');
        onEnded?.();
      };

      audio.onerror = () => {
        trySource(index + 1);
      };

      audio.play().catch(() => {
        trySource(index + 1);
      });
    };

    trySource(0);
  }, [src, text, playSpeechSynthesis, onPlay, onEnded]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  useEffect(() => {
    if (autoPlay) {
      play();
    }

    return () => {
      stop();
    };
  }, [autoPlay, play, stop]);

  return {
    isPlaying,
    engine,
    play,
    pause,
    toggle,
    stop,
  };
}
