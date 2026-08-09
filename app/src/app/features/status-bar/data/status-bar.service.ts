import { inject, Injectable } from '@angular/core';
import { StatusBar, Style, Animation } from '@capacitor/status-bar';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

/** Thrown when a StatusBar action is attempted while running in a plain browser tab. */
export class BrowserNotSupportedError extends Error {
  constructor() {
    super('StatusBar plugin is not available in the browser.');
    this.name = 'BrowserNotSupportedError';
  }
}

/** Thrown when setBackgroundColor is attempted on iOS, where it has no effect. */
export class IosNotSupportedError extends Error {
  constructor() {
    super('setBackgroundColor has no effect on iOS.');
    this.name = 'IosNotSupportedError';
  }
}

export interface StatusBarInfo {
  visible: boolean;
  style: Style;
  color?: string;
  overlays?: boolean;
}

export interface ColorSwatch {
  label: string;
  value: string;
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { label: 'Primary', value: '#6E5DE7' },
  { label: 'Midnight', value: '#1A1A2E' },
  { label: 'Success', value: '#2DD36F' },
  { label: 'Danger', value: '#EB445A' },
  { label: 'Warning', value: '#FFC409' },
  { label: 'White', value: '#FFFFFF' },
];

@Injectable({ providedIn: 'root' })
export class StatusBarService {
  private platformService = inject(PlatformService);
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /** True when running in a plain browser tab (no native StatusBar available). */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  isIos(): boolean {
    return this.platformService.getPlatform() === 'ios';
  }

  async getInfo(): Promise<StatusBarInfo> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    return StatusBar.getInfo();
  }

  async setDefault(): Promise<void> {
    await this.setStyle(Style.Light);
  }

  async setStyle(style: Style): Promise<void> {
    try {
      if (this.isBrowser()) throw new BrowserNotSupportedError();
      await StatusBar.setStyle({ style });
      await this.saveLog(
        'Style',
        `Style set to ${this.styleLabel(style)}`,
        'success',
      );
    } catch (error) {
      await this.saveLog('Style', this.describeError(error), 'danger');
      throw error;
    }
  }

  /** Android only — iOS silently ignores background color changes. */
  async setBackgroundColor(color: string): Promise<void> {
    try {
      if (this.isBrowser()) throw new BrowserNotSupportedError();
      if (this.isIos()) throw new IosNotSupportedError();
      await StatusBar.setBackgroundColor({ color });
      await this.saveLog('Background', `Background set to ${color}`, 'success');
    } catch (error) {
      if (error instanceof IosNotSupportedError) {
        await this.saveLog(
          'Background',
          'Background color has no effect on iOS',
          'warning',
        );
      } else {
        await this.saveLog('Background', this.describeError(error), 'danger');
      }
      throw error;
    }
  }

  async show(animation: Animation = Animation.Fade): Promise<void> {
    try {
      if (this.isBrowser()) throw new BrowserNotSupportedError();
      await StatusBar.show({ animation });
      await this.saveLog('Visibility', 'Status bar shown', 'success');
    } catch (error) {
      await this.saveLog('Visibility', this.describeError(error), 'danger');
      throw error;
    }
  }

  async hide(animation: Animation = Animation.Fade): Promise<void> {
    try {
      if (this.isBrowser()) throw new BrowserNotSupportedError();
      await StatusBar.hide({ animation });
      await this.saveLog('Visibility', 'Status bar hidden', 'success');
    } catch (error) {
      await this.saveLog('Visibility', this.describeError(error), 'danger');
      throw error;
    }
  }

  async setOverlaysWebView(overlay: boolean): Promise<void> {
    try {
      if (this.isBrowser()) throw new BrowserNotSupportedError();
      await StatusBar.setOverlaysWebView({ overlay });
      await this.saveLog(
        'Overlay',
        `Overlay ${overlay ? 'enabled' : 'disabled'}`,
        'success',
      );
    } catch (error) {
      await this.saveLog('Overlay', this.describeError(error), 'danger');
      throw error;
    }
  }

  /** Fallback info used to preview the UI when running in the browser. */
  getMockInfo(): StatusBarInfo {
    return {
      visible: true,
      style: Style.Default,
      color: '#1A1A2E',
      overlays: false,
    };
  }

  /** Writes the activity log entry and, on success, marks StatusBar as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'StatusBar',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('StatusBar');
    }
  }

  private describeError(error: unknown): string {
    if (error instanceof BrowserNotSupportedError) {
      return 'Not available in the browser';
    }
    return (error instanceof Error && error.message) || 'Unknown';
  }

  private styleLabel(style: Style): string {
    switch (style) {
      case Style.Light:
        return 'Light';
      case Style.Dark:
        return 'Dark';
      default:
        return 'Default';
    }
  }
}

export { Style, Animation };
