import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';

export type NetworkListener = (status: ConnectionStatus) => void;

/**
 * Thin wrapper around @capacitor/network.
 * Exposes the current status plus a single subscription point for
 * networkStatusChange, so the page doesn't touch the plugin directly.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private listenerHandle: { remove: () => Promise<void> } | null = null;

  async getStatus(): Promise<ConnectionStatus> {
    return Network.getStatus();
  }

  async watchStatus(callback: NetworkListener): Promise<void> {
    if (this.listenerHandle) return;
    this.listenerHandle = await Network.addListener(
      'networkStatusChange',
      callback,
    );
  }

  async stopWatching(): Promise<void> {
    if (!this.listenerHandle) return;
    await this.listenerHandle.remove();
    this.listenerHandle = null;
  }
}
