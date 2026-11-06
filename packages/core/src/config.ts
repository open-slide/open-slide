import type { Locale } from './locale/types';

export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type OpenSlideAgentConfig = {
  enabled?: boolean;
  providers?: OpenSlideAcpProviderConfig[];
  /** Offer the built-in Claude Code and Codex providers. Defaults to `true`. */
  builtinProviders?: boolean;
};

export type OpenSlideAcpProviderConfig = {
  id: string;
  name: string;
  type: 'acp';
  command: string;
  args?: string[];
};

export type OpenSlideConfig = {
  base?: string;
  slidesDir?: string;
  themesDir?: string;
  assetsDir?: string;
  port?: number;
  allowedHosts?: string[] | true;
  /**
   * @deprecated Pick the UI language from the language switcher in the slide UI
   * instead. When set, this only seeds the initial language until the user
   * chooses one (their choice is then remembered locally).
   */
  locale?: Locale;
  build?: OpenSlideBuildConfig;
  agent?: OpenSlideAgentConfig;
};
