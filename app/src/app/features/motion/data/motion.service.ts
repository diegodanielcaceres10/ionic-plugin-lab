import { Injectable } from '@angular/core';
import { Motion } from '@capacitor/motion';
import type {
  AccelListenerEvent,
  OrientationListenerEvent,
} from '@capacitor/motion';
import type { PluginListenerHandle } from '@capacitor/core';

export type {
  AccelListenerEvent,
  OrientationListenerEvent,
  PluginListenerHandle,
};

@Injectable({ providedIn: 'root' })
export class MotionService {
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
    const globalDeviceMotionEvent = (
      window as unknown as {
        DeviceMotionEvent: { requestPermission: () => Promise<string> };
      }
    ).DeviceMotionEvent;
    const result = await globalDeviceMotionEvent.requestPermission();
    return result === 'granted';
  }

  async addAccelListener(
    callback: (event: AccelListenerEvent) => void,
  ): Promise<PluginListenerHandle> {
    return Motion.addListener('accel', callback);
  }

  async addOrientationListener(
    callback: (event: OrientationListenerEvent) => void,
  ): Promise<PluginListenerHandle> {
    return Motion.addListener('orientation', callback);
  }

  async removeAllListeners(): Promise<void> {
    await Motion.removeAllListeners();
  }
}
