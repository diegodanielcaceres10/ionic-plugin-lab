import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import type { PluginListenerHandle } from '@capacitor/core';
import { PlatformService } from '../../../core/platform/platform.service';

export interface QuickLink {
  label: string;
  url: string;
  icon: string;
  /** Accent color for the icon on the grid card (any valid CSS color). */
  color: string;
}

/** Default URL used to quickly test the plugin against your own site. */
export const DEFAULT_URL = 'https://diegodanielcaceres10.github.io/nura/';

export const QUICK_LINKS: QuickLink[] = [
  {
    label: 'My Website',
    url: DEFAULT_URL,
    icon: 'globe-outline',
    color: 'var(--ion-color-primary)',
  },
  {
    label: 'Google',
    url: 'https://google.com',
    icon: 'logo-google',
    color: '#4285f4',
  },
  {
    label: 'GitHub',
    url: 'https://github.com',
    icon: 'logo-github',
    color: '#181717',
  },
  {
    label: 'Ionic',
    url: 'https://ionicframework.com',
    icon: 'flash-outline',
    color: '#3880ff',
  },
  {
    label: 'Capacitor',
    url: 'https://capacitorjs.com',
    icon: 'hardware-chip-outline',
    color: '#11999e',
  },
];

/**
 * Wraps @capacitor/browser. No runtime permissions involved on either
 * platform — it opens a SFSafariViewController / Custom Tabs view natively,
 * and a new tab/window on web (which pop-up blockers may interfere with).
 */
@Injectable({ providedIn: 'root' })
export class BrowserService {
  constructor(private platformService: PlatformService) {}

  /** True when running in the browser, where open() falls back to window.open. */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  /** Opens the given URL in the in-app browser. */
  async open(url: string): Promise<void> {
    await Browser.open({ url });
  }

  /** Closes the in-app browser if it's currently open. */
  async close(): Promise<void> {
    await Browser.close();
  }

  /** Fires when the user dismisses the in-app browser (back gesture, swipe down, closing the tab, etc). */
  onFinished(callback: () => void): Promise<PluginListenerHandle> {
    return Browser.addListener('browserFinished', callback);
  }

  /** Fires each time a page finishes loading inside the in-app browser. */
  onPageLoaded(callback: () => void): Promise<PluginListenerHandle> {
    return Browser.addListener('browserPageLoaded', callback);
  }
}
