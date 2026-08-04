import { Injectable } from '@angular/core';
import { Browser, OpenOptions } from '@capacitor/browser';

/**
 * Thin wrapper around @capacitor/browser.
 * Centralizes the open/close calls and the browserPageLoaded /
 * browserFinished event listeners, since the plugin's event API only
 * fires those two — "opened" is reported manually right after open()
 * resolves, since there's no native event for it.
 */
@Injectable({ providedIn: 'root' })
export class BrowserService {
  async open(options: OpenOptions): Promise<void> {
    await Browser.open(options);
  }

  async close(): Promise<void> {
    await Browser.close();
  }

  async teardown(): Promise<void> {
    await Browser.removeAllListeners();
  }
}
