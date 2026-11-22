import { type BrowserWindow, type Rectangle, type WebContents, WebContentsView } from 'electron';
import type { SwitcherState, SwitcherTab } from '../shared/types';

const REVEAL_DELAY_MS = 150;
// A hidden view keeps its last frame, so the switcher paints itself empty first.
const HIDE_DELAY_MS = 100;
const ARROW_STEPS = new Map([
  ['ArrowRight', 1],
  ['ArrowDown', 1],
  ['ArrowLeft', -1],
  ['ArrowUp', -1],
]);

type Session = {
  order: string[];
  index: number;
  shown: boolean;
  revealTimer: NodeJS.Timeout | null;
};

export type SwitcherHost = {
  window: BrowserWindow;
  preload: string;
  loadShell: (contents: WebContents, route: string) => void;
  keepKeys: (view: WebContentsView) => void;
  dispose: (view: WebContentsView) => void;
  order: () => { ids: string[]; startsAtActive: boolean } | null;
  describe: (id: string) => SwitcherTab | null;
  onReveal: () => void;
  onEnd: (pickedId: string | null) => void;
};

export class TabSwitcher {
  private page: WebContentsView | null = null;
  private session: Session | null = null;
  private hideTimer: NodeJS.Timeout | null = null;

  constructor(private readonly host: SwitcherHost) {}

  get active(): boolean {
    return this.session !== null;
  }

  get view(): WebContentsView | null {
    return this.page;
  }

  get contents(): WebContents | null {
    const contents = this.page?.webContents;
    return contents && !contents.isDestroyed() ? contents : null;
  }

  onInput(event: Electron.Event, input: Electron.Input) {
    const down = input.type === 'keyDown';
    const ctrlTab = input.key === 'Tab' && input.control && !input.alt && !input.meta;
    const delta = input.shift ? -1 : 1;
    const arrow = ARROW_STEPS.get(input.key);
    if (!this.session) {
      if (down && ctrlTab && this.begin(delta)) event.preventDefault();
      return;
    }
    // Nothing is swallowed from here on: the release of Ctrl has to arrive.
    const ctrlReleased = input.key === 'Control' ? !down : !input.control;
    if (down && input.key === 'Escape') this.end(false);
    else if (ctrlReleased || (down && input.key === 'Enter')) this.end(true);
    else if (down && ctrlTab) this.step(delta);
    else if (down && arrow) this.step(arrow);
  }

  pick(id: unknown) {
    const session = this.session;
    if (!session) return;
    const index = typeof id === 'string' ? session.order.indexOf(id) : -1;
    if (index >= 0) session.index = index;
    this.end(index >= 0);
  }

  end(commit: boolean) {
    const session = this.session;
    if (!session) return;
    const picked = session.order[session.index];
    this.close();
    this.host.onEnd(commit ? picked : null);
  }

  close() {
    const session = this.session;
    if (!session) return;
    if (session.revealTimer) clearTimeout(session.revealTimer);
    this.session = null;
    this.publish();
    const hide = () => {
      this.hideTimer = null;
      if (this.contents) this.page?.setVisible(false);
    };
    if (session.shown) this.hideTimer = setTimeout(hide, HIDE_DELAY_MS);
    else hide();
  }

  refresh() {
    if (this.session?.shown) this.publish();
  }

  warm() {
    if (!this.page) this.create();
  }

  setBounds(bounds: Rectangle) {
    this.page?.setBounds(bounds);
  }

  destroy() {
    this.close();
    this.discardView();
  }

  private begin(delta: number): boolean {
    const order = this.host.order();
    if (!order) return false;
    const { ids, startsAtActive } = order;
    this.session = {
      order: ids,
      index: delta > 0 ? (startsAtActive ? 1 : 0) : ids.length - 1,
      shown: false,
      revealTimer: setTimeout(() => this.reveal(), REVEAL_DELAY_MS),
    };
    this.cancelHide();
    const view = this.page ?? this.create();
    this.raise(view);
    const { width, height } = this.host.window.getContentBounds();
    view.setBounds({ x: 0, y: 0, width, height });
    view.setVisible(true);
    // A page whose key-down was swallowed gets no key-ups until its next key-down,
    // so the switcher takes the keys to see Ctrl let go.
    view.webContents.focus();
    return true;
  }

  private step(delta: number) {
    const session = this.session;
    if (!session) return;
    const count = session.order.length;
    session.index = (session.index + delta + count) % count;
    if (session.shown) this.publish();
    else this.reveal();
  }

  private reveal() {
    const session = this.session;
    if (!session || session.shown) return;
    if (session.revealTimer) clearTimeout(session.revealTimer);
    session.revealTimer = null;
    session.shown = true;
    this.host.onReveal();
    this.publish();
  }

  private publish() {
    this.contents?.send('switcher:state', this.state());
  }

  private state(): SwitcherState | null {
    const session = this.session;
    if (!session?.shown) return null;
    const tabs = session.order.flatMap((id) => this.host.describe(id) ?? []);
    return { tabs, selectedId: session.order[session.index] };
  }

  private create(): WebContentsView {
    const view = new WebContentsView({
      webPreferences: { preload: this.host.preload, sandbox: true, contextIsolation: true },
    });
    view.setBackgroundColor('#00000000');
    view.setVisible(false);
    const contents = view.webContents;
    this.host.keepKeys(view);
    contents.on('before-input-event', (e, input) => this.onInput(e, input));
    contents.on('did-finish-load', () => this.publish());
    contents.on('will-navigate', (e) => e.preventDefault());
    contents.on('render-process-gone', () => {
      if (this.page !== view) return;
      this.end(false);
      this.discardView();
    });
    this.raise(view);
    this.host.loadShell(contents, 'switcher');
    this.page = view;
    return view;
  }

  private raise(view: WebContentsView) {
    this.host.window.contentView.addChildView(view);
  }

  private cancelHide() {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }

  private discardView() {
    const view = this.page;
    this.page = null;
    this.cancelHide();
    if (view) this.host.dispose(view);
  }
}
