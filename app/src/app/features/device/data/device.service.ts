import { Injectable } from '@angular/core';
import { Device, type DeviceInfo } from '@capacitor/device';

export interface BatterySnapshot {
  level: number | null;
  isCharging: boolean | null;
  /** false when the Battery API isn't available (common on some browsers/OSs). */
  supported: boolean;
}

export interface DeviceSnapshot {
  identifier: string;
  info: DeviceInfo;
  language: string;
  locale: string;
  battery: BatterySnapshot;
}

/**
 * Wraps @capacitor/device so the page never talks to the plugin directly.
 * Combines getId(), getInfo(), getLanguageCode(), getLanguageTag() and
 * getBatteryInfo() into a single snapshot, since they're always read together.
 */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  async getSnapshot(): Promise<DeviceSnapshot> {
    const [id, info, languageCode, languageTag, battery] = await Promise.all([
      Device.getId(),
      Device.getInfo(),
      Device.getLanguageCode(),
      Device.getLanguageTag(),
      this.getBatterySafely(),
    ]);

    return {
      identifier: id.identifier,
      info,
      language: languageCode.value,
      locale: languageTag.value,
      battery,
    };
  }

  /**
   * getBatteryInfo() isn't implemented on every browser (notably Firefox),
   * so it's isolated here and never throws — the page just shows
   * "not available" instead of failing the whole snapshot.
   */
  private async getBatterySafely(): Promise<BatterySnapshot> {
    try {
      const battery = await Device.getBatteryInfo();
      return {
        level: battery.batteryLevel ?? null,
        isCharging: battery.isCharging ?? null,
        supported: true,
      };
    } catch {
      return { level: null, isCharging: null, supported: false };
    }
  }
}
