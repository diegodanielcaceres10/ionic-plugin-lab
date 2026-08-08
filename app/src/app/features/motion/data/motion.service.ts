import { inject, Injectable } from '@angular/core';
import { Motion } from '@capacitor/motion';
import type {
  AccelListenerEvent,
  OrientationListenerEvent,
} from '@capacitor/motion';
import type { PluginListenerHandle } from '@capacitor/core';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export type {
  AccelListenerEvent,
  OrientationListenerEvent,
  PluginListenerHandle,
};

@Injectable({ providedIn: 'root' })
export class MotionService {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /**
   * True on platforms that require an explicit, user-gesture-triggered
   * permission request before motion events fire — namely iOS 13+
   * (Safari and WKWebView). Android and desktop browsers don't need this.
   */
  needsPermissionRequest(): boolean {
    const globalDeviceMotionEvent = (
      window as unknown as {
        DeviceMotionEvent?: { requestPermission?: () => Promise<string> };
      }
    ).DeviceMotionEvent;
    return typeof globalDeviceMotionEvent?.requestPermission === 'function';
  }

  async requestPermission(): Promise<boolean> {
    try {
      const globalDeviceMotionEvent = (
        window as unknown as {
          DeviceMotionEvent: { requestPermission: () => Promise<string> };
        }
      ).DeviceMotionEvent;
      const result = await globalDeviceMotionEvent.requestPermission();
      const granted = result === 'granted';
      await this.saveLog(
        'Permission',
        granted ? 'Motion permission granted' : 'Motion permission denied',
        granted ? 'success' : 'danger',
      );
      return granted;
    } catch (error) {
      await this.saveLog('Permission', 'Permission request failed', 'danger');
      throw error;
    }
  }

  async addAccelListener(
    callback: (event: AccelListenerEvent) => void,
  ): Promise<PluginListenerHandle> {
    const handle = await Motion.addListener('accel', callback);
    await this.saveLog('Accelerometer', 'Accelerometer started', 'success');
    return handle;
  }

  async addOrientationListener(
    callback: (event: OrientationListenerEvent) => void,
  ): Promise<PluginListenerHandle> {
    const handle = await Motion.addListener('orientation', callback);
    await this.saveLog('Orientation', 'Orientation started', 'success');
    return handle;
  }

  /** Removes an active accelerometer listener and logs the stop. */
  async stopAccelListener(handle: PluginListenerHandle): Promise<void> {
    await handle.remove();
    await this.saveLog('Accelerometer', 'Accelerometer stopped', 'success');
  }

  /** Removes an active orientation listener and logs the stop. */
  async stopOrientationListener(handle: PluginListenerHandle): Promise<void> {
    await handle.remove();
    await this.saveLog('Orientation', 'Orientation stopped', 'success');
  }

  async removeAllListeners(): Promise<void> {
    await Motion.removeAllListeners();
  }

  /** Writes the activity log entry and, on success, marks Motion as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Motion',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Motion');
    }
  }
}
