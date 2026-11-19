import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SlideAudio } from '../components/slide-audio.tsx';

describe('SlideAudio component', () => {
  it('renders null when showControls is false and no children provided', () => {
    const html = renderToStaticMarkup(
      <SlideAudio src="/assets/audio/act-1.mp3" text="Test narration" />,
    );
    expect(html).toBe('');
  });

  it('renders a button when showControls is true', () => {
    const html = renderToStaticMarkup(
      <SlideAudio src="/assets/audio/act-1.mp3" text="Test narration" showControls={true} />,
    );
    expect(html).toContain('<button');
    expect(html).toContain('data-osd-interactive');
    expect(html).toContain('aria-label="Play slide narration"');
    expect(html).toContain('Play Narration');
  });

  it('renders custom children', () => {
    const html = renderToStaticMarkup(
      <SlideAudio showControls={true}>
        <span className="custom-icon">🎙️ Voiceover</span>
      </SlideAudio>,
    );
    expect(html).toContain('<button');
    expect(html).toContain('class="custom-icon"');
    expect(html).toContain('🎙️ Voiceover');
  });

  it('supports render function as children', () => {
    const html = renderToStaticMarkup(
      <SlideAudio showControls={true}>
        {({ isPlaying }) => <span>{isPlaying ? 'Speaking...' : 'Click to Speak'}</span>}
      </SlideAudio>,
    );
    expect(html).toContain('Click to Speak');
  });

  it('applies custom className and style', () => {
    const html = renderToStaticMarkup(
      <SlideAudio showControls={true} className="my-audio-btn" style={{ color: 'red' }} />,
    );
    expect(html).toContain('class="my-audio-btn"');
    expect(html).toContain('style="color:red"');
  });
});
