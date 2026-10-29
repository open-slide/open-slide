import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { loadGoogleFont } from '@/lib/og-fonts';
import { coreReleases } from '@/lib/releases';
import { appName } from '@/lib/shared';

export const dynamicParams = false;

export function generateStaticParams() {
  return coreReleases.map((r) => ({ version: r.version }));
}

const NIGHT = '#0B0B0C';
const INK = '#F4F4F5';
const MUTED = '#8A8A8F';
const ACCENT = '#DE3B3D';

export async function GET(_req: Request, { params }: RouteContext<'/og/releases/[version]'>) {
  const { version } = await params;
  const release = coreReleases.find((r) => r.version === version);
  if (!release) notFound();

  const [geistMedium, mono, logoBuffer] = await Promise.all([
    loadGoogleFont('Geist', 500),
    loadGoogleFont('Geist Mono', 500),
    readFile(path.join(process.cwd(), 'public/open-slide.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  const [major, minor] = version.split('.');

  return new ImageResponse(
    <Cover title={release.title} label={`v${major}.${minor}`} logoSrc={logoSrc} />,
    {
      width: 1200,
      height: 500,
      fonts: [
        { name: 'Geist', data: geistMedium, weight: 500, style: 'normal' },
        { name: 'Geist Mono', data: mono, weight: 500, style: 'normal' },
      ],
    },
  );
}

function Cover({ title, label, logoSrc }: { title: string; label: string; logoSrc: string }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: NIGHT,
        backgroundImage: `radial-gradient(circle at 88% 110%, ${ACCENT}55 0%, ${ACCENT}00 46%), radial-gradient(circle at 70% -20%, #ffffff14 0%, #ffffff00 42%)`,
        fontFamily: 'Geist',
        color: INK,
      }}
    >
      {[
        { right: -40, top: 150, rotate: -8, opacity: 0.35 },
        { right: 30, top: 110, rotate: -3, opacity: 0.6 },
        { right: 100, top: 70, rotate: 3, opacity: 1 },
      ].map((card) => (
        <div
          key={card.rotate}
          style={{
            position: 'absolute',
            right: card.right,
            top: card.top,
            width: 380,
            height: 214,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 24,
            gap: 10,
            borderRadius: 14,
            border: '1px solid #ffffff26',
            backgroundColor: '#161618',
            boxShadow: '0 30px 60px #00000080',
            transform: `rotate(${card.rotate}deg)`,
            opacity: card.opacity,
          }}
        >
          <div style={{ width: 160, height: 14, borderRadius: 4, backgroundColor: '#ffffff33' }} />
          <div style={{ width: 240, height: 10, borderRadius: 4, backgroundColor: '#ffffff1a' }} />
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: ACCENT }} />
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          width: 760,
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* biome-ignore lint/performance/noImgElement: next/og uses Satori; <img> is the only supported image tag */}
          <img src={logoSrc} width={36} height={36} alt="" />
          <span
            style={{
              fontFamily: 'Geist Mono',
              fontSize: 18,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            {appName}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid #ffffff2e',
              backgroundColor: '#ffffff0d',
              fontFamily: 'Geist Mono',
              fontSize: 20,
              color: '#D4D4D8',
            }}
          >
            {label}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 28 ? 64 : 84,
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              maxHeight: 200,
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}
