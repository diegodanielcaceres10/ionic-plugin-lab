import { inject, Injectable } from '@angular/core';
import { Device, type DeviceInfo } from '@capacitor/device';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';

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
  private pluginsCatalogService = inject(PluginsCatalogService);
  private pluginLogsService = inject(PluginLogsService);

  async getSnapshot(): Promise<DeviceSnapshot> {
    try {
      const [id, info, languageCode, languageTag, battery] = await Promise.all([
        Device.getId(),
        Device.getInfo(),
        Device.getLanguageCode(),
        Device.getLanguageTag(),
        this.getBatterySafely(),
      ]);

      await this.saveLog(
        'Info',
        `Loaded device info (${info.platform}/${info.operatingSystem})`,
        'success',
      );

      return {
        identifier: id.identifier,
        info,
        language: languageCode.value,
        locale: languageTag.value,
        battery,
      };
    } catch (error) {
      await this.saveLog(
        'Info',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
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
      await this.saveLog('Battery', 'Battery info not available', 'warning');
      return { level: null, isCharging: null, supported: false };
    }
  }

  /** Writes the activity log entry and, on success, marks Device as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Device',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Device');
    }
  }
}
