import { inject, Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import type { PluginListenerHandle } from '@capacitor/core';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

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
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  constructor(private platformService: PlatformService) {}

  /** True when running in the browser, where open() falls back to window.open. */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  /** Opens the given URL in the in-app browser. */
  async open(url: string): Promise<void> {
    try {
      await Browser.open({ url });
      await this.saveLog('Open', `Opened ${url}`, 'success');
    } catch (error) {
      await this.saveLog(
        'Open',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Closes the in-app browser if it's currently open. */
  async close(): Promise<void> {
    try {
      await Browser.close();
      await this.saveLog('Close', 'Browser closed manually', 'success');
    } catch (error) {
      await this.saveLog(
        'Close',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Fires when the user dismisses the in-app browser (back gesture, swipe down, closing the tab, etc). */
  onFinished(callback: () => void): Promise<PluginListenerHandle> {
    return Browser.addListener('browserFinished', () => {
      void this.saveLog('Finished', 'Browser closed', 'success');
      callback();
    });
  }

  /** Fires each time a page finishes loading inside the in-app browser. */
  onPageLoaded(callback: () => void): Promise<PluginListenerHandle> {
    return Browser.addListener('browserPageLoaded', () => {
      void this.saveLog('Page Loaded', 'Page loaded', 'success');
      callback();
    });
  }

  /** Writes the activity log entry and, on success, marks Browser as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Browser',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Browser');
    }
  }
}
