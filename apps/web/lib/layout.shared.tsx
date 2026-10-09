import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/open-slide.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span>{appName}</span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.owner}/${gitConfig.repo}`,
  };
}
