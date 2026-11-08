import { GeistSerif } from 'geist/font/serif';
import type { Metadata } from 'next';
import { Closing } from '@/components/desktop/closing';
import { Features } from '@/components/desktop/features';
import { DesktopHero } from '@/components/desktop/hero';
import { Statement } from '@/components/desktop/statement';
import { Footer } from '@/components/landing/footer';
import { Nav } from '@/components/landing/nav';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { fetchGitHubStars, formatStarCount } from '@/lib/github';
import './desktop.css';

const description =
  'open-slide is coming to the desktop: every deck in its own tab, Claude Code and Codex built in, and nothing to install.';

export const metadata: Metadata = {
  title: 'Desktop',
  description,
  alternates: { canonical: '/desktop' },
  openGraph: { title: 'open-slide for desktop — coming soon', description, url: '/desktop' },
  twitter: { title: 'open-slide for desktop — coming soon', description },
};

export const viewport = {
  themeColor: '#070608',
  colorScheme: 'dark',
};

export default async function DesktopPage() {
  const stars = await fetchGitHubStars();
  const githubStars = stars !== null ? formatStarCount(stars) : null;

  return (
    <div className={`os-desktop ${GeistSerif.variable} relative flex flex-1 flex-col`}>
      <Nav githubStars={githubStars} themeToggle={false} />
      <ScrollReveal />
      <main className="relative flex-1">
        <DesktopHero />
        <Features />
        <Statement />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
