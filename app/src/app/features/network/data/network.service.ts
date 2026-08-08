import { inject, Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import type { PluginListenerHandle } from '@capacitor/core';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

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
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /** Reads the current connection status once. */
  async getStatus(): Promise<NetworkInfo> {
    try {
      const status = await Network.getStatus();
      const info = this.toNetworkInfo(status);
      await this.saveLog('Status', `Status: ${this.describe(info)}`, 'success');
      return info;
    } catch (error) {
      await this.saveLog(
        'Status',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /**
   * Subscribes to connection changes, invoking onChange on every update.
   * Returns a handle: call `.remove()` on it, or stopListening(), to stop.
   */
  async listen(onChange: NetworkChangeCallback): Promise<PluginListenerHandle> {
    const handle = await Network.addListener(
      'networkStatusChange',
      (status) => {
        const info = this.toNetworkInfo(status);
        void this.saveLog(
          'Listener',
          `Changed: ${this.describe(info)}`,
          'success',
        );
        onChange(info);
      },
    );
    await this.saveLog('Listener', 'Listener started', 'success');
    return handle;
  }

  /** Removes an active listener started with listen() and logs the stop. */
  async stopListening(handle: PluginListenerHandle): Promise<void> {
    await handle.remove();
    await this.saveLog('Listener', 'Listener stopped', 'success');
  }

  /** Writes the activity log entry and, on success, marks Network as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Network',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Network');
    }
  }

  private describe(info: NetworkInfo): string {
    return `${info.connected ? 'Connected' : 'Disconnected'} (${info.connectionType})`;
  }

  private toNetworkInfo(status: ConnectionStatus): NetworkInfo {
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  }
}
