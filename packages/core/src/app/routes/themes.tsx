import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/lib/use-locale';
import { pad2 } from '@/lib/utils';
import { SystemViewIcon } from '../components/sidebar/folder-item';
import { ThemeDetail } from '../components/themes/theme-detail';
import { ThemesGallery } from '../components/themes/themes-gallery';
import { themes as themeRegistry } from '../lib/themes';

export function ThemesGalleryPage() {
  const navigate = useNavigate();
  const t = useLocale();
  return (
    <>
      <header className="mb-8 md:mb-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <SystemViewIcon kind="themes" className="text-muted-foreground" />
          <h1 className="font-heading text-[19px] font-semibold leading-none tracking-[-0.015em] md:text-[21px]">
            {t.themes.title}
          </h1>
          <span className="folio ml-0.5">{pad2(themeRegistry.length)}</span>
        </div>
        {themeRegistry.length > 0 ? (
          <p className="mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
            {t.themes.galleryHintPrefix}
            <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
              /create-theme
            </code>
            {t.themes.galleryHintSuffix}
          </p>
        ) : null}
      </header>
      <ThemesGallery onOpen={(id) => navigate(`/themes/${encodeURIComponent(id)}`)} />
    </>
  );
}

export function ThemeDetailPage() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  if (!themeId) return null;
  return <ThemeDetail key={themeId} themeId={themeId} onBack={() => navigate('/themes')} />;
}
