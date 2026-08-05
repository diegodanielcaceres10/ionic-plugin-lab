import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NetworkInfo {
  connected: boolean;
  connectionType: ConnectionStatus['connectionType'];
}

type NetworkChangeCallback = (status: NetworkInfo) => void;

/**
 * Wraps @capacitor/network so the page never talks to the plugin directly.
 * Works both on native and on browser (backed by navigator.onLine / the
 * Network Information API where available).
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  /** Reads the current connection status once. */
  async getStatus(): Promise<NetworkInfo> {
    const status = await Network.getStatus();
    return this.toNetworkInfo(status);
  }

  /**
   * Subscribes to connection changes, invoking onChange on every update.
   * Returns a handle: call `.remove()` on it to stop listening.
   */
  async listen(onChange: NetworkChangeCallback): Promise<PluginListenerHandle> {
    return Network.addListener('networkStatusChange', (status) => {
      onChange(this.toNetworkInfo(status));
    });
  }

  private toNetworkInfo(status: ConnectionStatus): NetworkInfo {
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  }
}
