import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style, Animation } from '@capacitor/status-bar';

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
  /** True when running in a plain browser tab (no native StatusBar available). */
  isBrowser(): boolean {
    return !Capacitor.isNativePlatform();
  }

  isIos(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  async getInfo(): Promise<StatusBarInfo> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    return StatusBar.getInfo();
  }

  async setStyle(style: Style): Promise<void> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    await StatusBar.setStyle({ style });
  }

  /** Android only — iOS silently ignores background color changes. */
  async setBackgroundColor(color: string): Promise<void> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    if (this.isIos()) throw new IosNotSupportedError();
    await StatusBar.setBackgroundColor({ color });
  }

  async show(animation: Animation = Animation.Fade): Promise<void> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    await StatusBar.show({ animation });
  }

  async hide(animation: Animation = Animation.Fade): Promise<void> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    await StatusBar.hide({ animation });
  }

  async setOverlaysWebView(overlay: boolean): Promise<void> {
    if (this.isBrowser()) throw new BrowserNotSupportedError();
    await StatusBar.setOverlaysWebView({ overlay });
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
}

export { Style, Animation };
